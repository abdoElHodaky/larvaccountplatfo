#!/usr/bin/env node

/**
 * TypeScript Pattern Analysis Script
 * 
 * Analyzes TypeScript/JavaScript codebase for naming patterns,
 * interface usage, type definitions, and component structures
 * to identify resimplification opportunities.
 */

import * as fs from 'fs';
import * as path from 'path';

interface AnalysisResults {
  variables: Array<{name: string, file: string, type: string, namingPattern: string}>;
  functions: Array<{name: string, file: string, namingPattern: string}>;
  interfaces: Array<{name: string, file: string, namingPattern: string}>;
  types: Array<{name: string, file: string, namingPattern: string}>;
  classes: Array<{name: string, file: string, namingPattern: string}>;
  components: Array<{name: string, file: string, namingPattern: string}>;
  patterns: Array<{type: string, description: string, count: number, examples: string[]}>;
  statistics: {
    totalElements: number;
    namingPatterns: Record<string, number>;
    namingPercentages: Record<string, number>;
    variableCount: number;
    functionCount: number;
    interfaceCount: number;
    typeCount: number;
    classCount: number;
    componentCount: number;
  };
}

class TypeScriptPatternAnalyzer {
  private results: AnalysisResults = {
    variables: [],
    functions: [],
    interfaces: [],
    types: [],
    classes: [],
    components: [],
    patterns: [],
    statistics: {
      totalElements: 0,
      namingPatterns: {},
      namingPercentages: {},
      variableCount: 0,
      functionCount: 0,
      interfaceCount: 0,
      typeCount: 0,
      classCount: 0,
      componentCount: 0
    }
  };

  private namingPatterns: Record<string, number> = {
    camelCase: 0,
    snake_case: 0,
    PascalCase: 0,
    UPPER_CASE: 0,
    'kebab-case': 0,
    mixed: 0
  };

  public analyze(directory: string): AnalysisResults {
    console.log('🔍 Starting TypeScript pattern analysis...');
    
    this.analyzeDirectory(directory);
    this.generateStatistics();
    this.identifyPatterns();
    
    console.log('✅ Analysis complete!');
    
    return this.results;
  }

  private analyzeDirectory(directory: string): void {
    const files = this.getAllFiles(directory, ['.ts', '.tsx', '.js', '.jsx']);
    
    for (const file of files) {
      this.analyzeFile(file);
    }
  }

  private getAllFiles(dir: string, extensions: string[]): string[] {
    const files: string[] = [];
    
    const traverse = (currentDir: string) => {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          // Skip node_modules and other irrelevant directories
          if (!['node_modules', '.git', 'dist', 'build'].includes(item)) {
            traverse(fullPath);
          }
        } else if (extensions.some(ext => item.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    };
    
    traverse(dir);
    return files;
  }

  private analyzeFile(filePath: string): void {
    const content = fs.readFileSync(filePath, 'utf-8');
    const relativePath = path.relative(process.cwd(), filePath);
    
    console.log(`📄 Analyzing: ${relativePath}`);

    // Analyze interfaces
    this.analyzeInterfaces(content, relativePath);
    
    // Analyze types
    this.analyzeTypes(content, relativePath);
    
    // Analyze classes
    this.analyzeClasses(content, relativePath);
    
    // Analyze components (React)
    this.analyzeComponents(content, relativePath);
    
    // Analyze variables
    this.analyzeVariables(content, relativePath);
    
    // Analyze functions
    this.analyzeFunctions(content, relativePath);
  }

  private analyzeInterfaces(content: string, filePath: string): void {
    // Match interface declarations
    const interfaceRegex = /interface\s+(\w+)(?:\s+extends\s+[\w\s,<>]+)?/g;
    let match;
    
    while ((match = interfaceRegex.exec(content)) !== null) {
      const interfaceName = match[1];
      
      this.results.interfaces.push({
        name: interfaceName,
        file: filePath,
        namingPattern: this.detectNamingPattern(interfaceName)
      });
      
      this.namingPatterns[this.detectNamingPattern(interfaceName)]++;
    }
  }

  private analyzeTypes(content: string, filePath: string): void {
    // Match type declarations
    const typeRegex = /type\s+(\w+)\s*=/g;
    let match;
    
    while ((match = typeRegex.exec(content)) !== null) {
      const typeName = match[1];
      
      this.results.types.push({
        name: typeName,
        file: filePath,
        namingPattern: this.detectNamingPattern(typeName)
      });
      
      this.namingPatterns[this.detectNamingPattern(typeName)]++;
    }
  }

  private analyzeClasses(content: string, filePath: string): void {
    // Match class declarations
    const classRegex = /class\s+(\w+)(?:\s+extends\s+\w+)?/g;
    let match;
    
    while ((match = classRegex.exec(content)) !== null) {
      const className = match[1];
      
      this.results.classes.push({
        name: className,
        file: filePath,
        namingPattern: this.detectNamingPattern(className)
      });
      
      this.namingPatterns[this.detectNamingPattern(className)]++;
    }
  }

  private analyzeComponents(content: string, filePath: string): void {
    // Match React component declarations (function components and arrow functions)
    const componentRegexes = [
      /(?:export\s+(?:default\s+)?)?(?:const|function)\s+(\w+)(?:\s*[:=]\s*(?:React\.)?FC|.*?=>\s*\()/g,
      /(?:export\s+(?:default\s+)?)?function\s+(\w+)\s*\([^)]*\)(?:\s*:\s*JSX\.Element)?/g
    ];
    
    for (const regex of componentRegexes) {
      let match;
      while ((match = regex.exec(content)) !== null) {
        const componentName = match[1];
        
        // Only consider PascalCase names as components
        if (this.detectNamingPattern(componentName) === 'PascalCase') {
          this.results.components.push({
            name: componentName,
            file: filePath,
            namingPattern: this.detectNamingPattern(componentName)
          });
          
          this.namingPatterns[this.detectNamingPattern(componentName)]++;
        }
      }
    }
  }

  private analyzeVariables(content: string, filePath: string): void {
    // Match variable declarations
    const variableRegexes = [
      /(?:const|let|var)\s+(\w+)(?:\s*:\s*[\w<>\[\]|&\s]+)?\s*=/g,
      /(\w+)\s*:\s*[\w<>\[\]|&\s]+(?:\s*[,;])/g // Object properties
    ];
    
    for (const regex of variableRegexes) {
      let match;
      while ((match = regex.exec(content)) !== null) {
        const variableName = match[1];
        
        // Skip common keywords and type names
        if (!['React', 'Component', 'Props', 'State', 'FC', 'JSX'].includes(variableName)) {
          this.results.variables.push({
            name: variableName,
            file: filePath,
            type: 'variable',
            namingPattern: this.detectNamingPattern(variableName)
          });
          
          this.namingPatterns[this.detectNamingPattern(variableName)]++;
        }
      }
    }
  }

  private analyzeFunctions(content: string, filePath: string): void {
    // Match function declarations
    const functionRegexes = [
      /(?:export\s+(?:default\s+)?)?function\s+(\w+)\s*\(/g,
      /(?:const|let)\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/g,
      /(\w+)\s*:\s*\([^)]*\)\s*=>/g // Method signatures
    ];
    
    for (const regex of functionRegexes) {
      let match;
      while ((match = regex.exec(content)) !== null) {
        const functionName = match[1];
        
        // Skip common React lifecycle methods and hooks
        if (!['render', 'componentDidMount', 'useEffect', 'useState', 'useCallback'].includes(functionName)) {
          this.results.functions.push({
            name: functionName,
            file: filePath,
            namingPattern: this.detectNamingPattern(functionName)
          });
          
          this.namingPatterns[this.detectNamingPattern(functionName)]++;
        }
      }
    }
  }

  private detectNamingPattern(name: string): string {
    if (/^[A-Z][A-Z0-9_]*$/.test(name)) {
      return 'UPPER_CASE';
    }
    
    if (/^[A-Z][a-zA-Z0-9]*$/.test(name)) {
      return 'PascalCase';
    }
    
    if (/^[a-z][a-zA-Z0-9]*$/.test(name)) {
      return 'camelCase';
    }
    
    if (/^[a-z][a-z0-9_]*$/.test(name)) {
      return 'snake_case';
    }
    
    if (name.includes('-')) {
      return 'kebab-case';
    }
    
    return 'mixed';
  }

  private generateStatistics(): void {
    const total = Object.values(this.namingPatterns).reduce((sum, count) => sum + count, 0);
    
    this.results.statistics = {
      totalElements: total,
      namingPatterns: { ...this.namingPatterns },
      namingPercentages: Object.fromEntries(
        Object.entries(this.namingPatterns).map(([pattern, count]) => [
          pattern,
          total > 0 ? Math.round((count / total) * 100 * 100) / 100 : 0
        ])
      ),
      variableCount: this.results.variables.length,
      functionCount: this.results.functions.length,
      interfaceCount: this.results.interfaces.length,
      typeCount: this.results.types.length,
      classCount: this.results.classes.length,
      componentCount: this.results.components.length
    };
  }

  private identifyPatterns(): void {
    const patterns: Array<{type: string, description: string, count: number, examples: string[]}> = [];
    
    // Check for interface naming consistency
    const interfaceNames = this.results.interfaces.map(i => i.name);
    const interfacesWithoutPrefix = interfaceNames.filter(name => 
      !name.startsWith('I') && !name.endsWith('Interface') && !name.endsWith('Props') && !name.endsWith('State')
    );
    
    if (interfacesWithoutPrefix.length > 0) {
      patterns.push({
        type: 'interface_naming_inconsistency',
        description: 'Some interfaces do not follow TypeScript naming conventions',
        count: interfacesWithoutPrefix.length,
        examples: interfacesWithoutPrefix.slice(0, 5)
      });
    }
    
    // Check for component naming consistency
    const componentNames = this.results.components.map(c => c.name);
    const componentsWithInconsistentNaming = componentNames.filter(name => 
      this.detectNamingPattern(name) !== 'PascalCase'
    );
    
    if (componentsWithInconsistentNaming.length > 0) {
      patterns.push({
        type: 'component_naming_inconsistency',
        description: 'Some components do not follow PascalCase convention',
        count: componentsWithInconsistentNaming.length,
        examples: componentsWithInconsistentNaming.slice(0, 5)
      });
    }
    
    // Check for potential type consolidation
    const typesByBaseName: Record<string, string[]> = {};
    for (const type of this.results.types) {
      const baseName = type.name.replace(/(Type|Interface|Props|State)$/, '');
      if (!typesByBaseName[baseName]) {
        typesByBaseName[baseName] = [];
      }
      typesByBaseName[baseName].push(type.name);
    }
    
    const duplicateTypes = Object.entries(typesByBaseName).filter(([, types]) => types.length > 1);
    if (duplicateTypes.length > 0) {
      patterns.push({
        type: 'potential_type_consolidation',
        description: 'Multiple types with similar names that could be consolidated',
        count: duplicateTypes.length,
        examples: duplicateTypes.slice(0, 5).map(([baseName]) => baseName)
      });
    }
    
    this.results.patterns = patterns;
  }

  public generateReport(): string {
    let report = '# TypeScript Pattern Analysis Report\n\n';
    report += `Generated on: ${new Date().toISOString().replace('T', ' ').substring(0, 19)}\n\n`;
    
    // Statistics
    const stats = this.results.statistics;
    report += '## 📊 Statistics\n\n';
    report += `- **Total Elements Analyzed**: ${stats.totalElements}\n`;
    report += `- **Interfaces**: ${stats.interfaceCount}\n`;
    report += `- **Types**: ${stats.typeCount}\n`;
    report += `- **Classes**: ${stats.classCount}\n`;
    report += `- **Components**: ${stats.componentCount}\n`;
    report += `- **Variables**: ${stats.variableCount}\n`;
    report += `- **Functions**: ${stats.functionCount}\n\n`;
    
    // Naming patterns
    report += '## 🏷️ Naming Pattern Distribution\n\n';
    for (const [pattern, percentage] of Object.entries(stats.namingPercentages)) {
      const count = stats.namingPatterns[pattern];
      report += `- **${pattern}**: ${count} (${percentage}%)\n`;
    }
    report += '\n';
    
    // Identified patterns
    if (this.results.patterns.length > 0) {
      report += '## 🔍 Identified Issues\n\n';
      for (const pattern of this.results.patterns) {
        report += `### ${pattern.description}\n`;
        report += `- **Type**: ${pattern.type}\n`;
        report += `- **Count**: ${pattern.count}\n`;
        if (pattern.examples.length > 0) {
          report += `- **Examples**: ${pattern.examples.join(', ')}\n`;
        }
        report += '\n';
      }
    }
    
    // Recommendations
    report += '## 💡 Recommendations\n\n';
    
    const camelCasePercentage = stats.namingPercentages.camelCase;
    const pascalCasePercentage = stats.namingPercentages.PascalCase;
    
    if (camelCasePercentage < 80) {
      report += `- **Standardize camelCase**: Only ${camelCasePercentage}% of elements use camelCase. Consider standardizing variable and function names.\n`;
    }
    
    if (pascalCasePercentage < 90) {
      report += `- **Standardize PascalCase**: Only ${pascalCasePercentage}% of components/classes use PascalCase. Ensure all follow this convention.\n`;
    }
    
    if (stats.interfaceCount > 0) {
      report += `- **Interface Consolidation**: Review ${stats.interfaceCount} interfaces for consolidation opportunities.\n`;
    }
    
    if (stats.typeCount > 0) {
      report += `- **Type Optimization**: Review ${stats.typeCount} type definitions for optimization and consolidation.\n`;
    }
    
    return report;
  }
}

// Run the analysis if called directly
if (require.main === module) {
  const analyzer = new TypeScriptPatternAnalyzer();
  const results = analyzer.analyze('resources/js/');
  
  // Generate and save report
  const report = analyzer.generateReport();
  fs.writeFileSync('docs/TYPESCRIPT_ANALYSIS_REPORT.md', report);
  
  console.log('\n📄 Report saved to: docs/TYPESCRIPT_ANALYSIS_REPORT.md');
  console.log('🎯 Analysis Summary:');
  console.log(`   - Interfaces: ${results.statistics.interfaceCount}`);
  console.log(`   - Types: ${results.statistics.typeCount}`);
  console.log(`   - Classes: ${results.statistics.classCount}`);
  console.log(`   - Components: ${results.statistics.componentCount}`);
  console.log(`   - Variables: ${results.statistics.variableCount}`);
  console.log(`   - Functions: ${results.statistics.functionCount}`);
  console.log(`   - Issues Found: ${results.patterns.length}`);
}
