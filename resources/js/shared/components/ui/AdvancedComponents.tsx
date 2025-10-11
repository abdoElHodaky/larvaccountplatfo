/**
 * Advanced Headless UI Components
 * Extended component library with complex UI patterns
 * Built on top of HeadlessUI with TailwindCSS styling
 */

import React, { forwardRef, ReactNode, Fragment, useState } from 'react';
import { 
  Listbox, 
  Combobox, 
  Tab, 
  Disclosure, 
  Popover, 
  RadioGroup, 
  Switch,
  Menu,
  Transition 
} from '@headlessui/react';
import { 
  ChevronUpDownIcon, 
  CheckIcon, 
  ChevronDownIcon,
  ChevronRightIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/20/solid';
import { cn } from './HeadlessUIComponents';

// =============================================================================
// SELECT COMPONENT (Enhanced Listbox)
// =============================================================================

interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  description?: string;
  icon?: ReactNode;
}

interface SelectProps {
  options: SelectOption[];
  value?: string | number;
  onChange?: (value: string | number) => void;
  placeholder?: string;
  disabled?: boolean;
  multiple?: boolean;
  size?: 'sm' | 'md' | 'lg';
  error?: boolean;
  className?: string;
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  ({ 
    options, 
    value, 
    onChange, 
    placeholder = "Select an option...",
    disabled = false,
    multiple = false,
    size = 'md',
    error = false,
    className,
    ...props 
  }, ref) => {
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-3 py-2 text-sm',
      lg: 'px-4 py-2 text-base',
    };

    const selectedOption = options.find(option => option.value === value);

    return (
      <Listbox value={value} onChange={onChange} disabled={disabled} multiple={multiple}>
        <div className="relative">
          <Listbox.Button
            ref={ref}
            className={cn(
              'relative w-full cursor-default rounded-md border bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
              error 
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                : 'border-gray-300',
              disabled && 'opacity-50 cursor-not-allowed',
              sizeClasses[size],
              className
            )}
            {...props}
          >
            <span className="block truncate">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </span>
          </Listbox.Button>

          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-dropdown mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {options.map((option) => (
                <Listbox.Option
                  key={option.value}
                  className={({ active }) =>
                    cn(
                      'relative cursor-default select-none py-2 pl-10 pr-4',
                      active ? 'bg-primary-100 text-primary-900' : 'text-gray-900',
                      option.disabled && 'opacity-50 cursor-not-allowed'
                    )
                  }
                  value={option.value}
                  disabled={option.disabled}
                >
                  {({ selected }) => (
                    <>
                      <div className="flex items-center">
                        {option.icon && (
                          <span className="mr-3 flex-shrink-0">{option.icon}</span>
                        )}
                        <div>
                          <span className={cn('block truncate', selected ? 'font-medium' : 'font-normal')}>
                            {option.label}
                          </span>
                          {option.description && (
                            <span className="text-xs text-gray-500">{option.description}</span>
                          )}
                        </div>
                      </div>
                      {selected ? (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-primary-600">
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    );
  }
);

Select.displayName = 'Select';

// =============================================================================
// COMBOBOX COMPONENT (Searchable Select)
// =============================================================================

interface ComboboxProps extends Omit<SelectProps, 'multiple'> {
  searchable?: boolean;
  onSearch?: (query: string) => void;
  loading?: boolean;
  allowCustomValue?: boolean;
}

export const SearchableSelect = forwardRef<HTMLInputElement, ComboboxProps>(
  ({ 
    options, 
    value, 
    onChange, 
    placeholder = "Search and select...",
    disabled = false,
    searchable = true,
    onSearch,
    loading = false,
    allowCustomValue = false,
    size = 'md',
    error = false,
    className,
    ...props 
  }, ref) => {
    const [query, setQuery] = useState('');

    const filteredOptions = query === ''
      ? options
      : options.filter((option) =>
          option.label.toLowerCase().includes(query.toLowerCase())
        );

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-3 py-2 text-sm',
      lg: 'px-4 py-2 text-base',
    };

    return (
      <Combobox value={value} onChange={onChange} disabled={disabled}>
        <div className="relative">
          <div className="relative w-full cursor-default overflow-hidden rounded-md border bg-white text-left shadow-sm focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500">
            <Combobox.Input
              ref={ref}
              className={cn(
                'w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0 focus:outline-none',
                error && 'text-red-900',
                disabled && 'opacity-50 cursor-not-allowed',
                sizeClasses[size],
                className
              )}
              displayValue={(option: SelectOption) => option?.label || ''}
              onChange={(event) => {
                setQuery(event.target.value);
                onSearch?.(event.target.value);
              }}
              placeholder={placeholder}
              disabled={disabled}
              {...props}
            />
            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
              {loading ? (
                <div className="animate-spin h-5 w-5 border-2 border-gray-300 border-t-primary-600 rounded-full" />
              ) : (
                <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              )}
            </Combobox.Button>
          </div>

          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            afterLeave={() => setQuery('')}
          >
            <Combobox.Options className="absolute z-dropdown mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {filteredOptions.length === 0 && query !== '' ? (
                <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                  {allowCustomValue ? (
                    <Combobox.Option value={query} className="cursor-pointer hover:bg-primary-100">
                      Create "{query}"
                    </Combobox.Option>
                  ) : (
                    'Nothing found.'
                  )}
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <Combobox.Option
                    key={option.value}
                    className={({ active }) =>
                      cn(
                        'relative cursor-default select-none py-2 pl-10 pr-4',
                        active ? 'bg-primary-100 text-primary-900' : 'text-gray-900'
                      )
                    }
                    value={option}
                  >
                    {({ selected, active }) => (
                      <>
                        <div className="flex items-center">
                          {option.icon && (
                            <span className="mr-3 flex-shrink-0">{option.icon}</span>
                          )}
                          <div>
                            <span className={cn('block truncate', selected ? 'font-medium' : 'font-normal')}>
                              {option.label}
                            </span>
                            {option.description && (
                              <span className="text-xs text-gray-500">{option.description}</span>
                            )}
                          </div>
                        </div>
                        {selected ? (
                          <span className={cn(
                            'absolute inset-y-0 left-0 flex items-center pl-3',
                            active ? 'text-primary-600' : 'text-primary-600'
                          )}>
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </Transition>
        </div>
      </Combobox>
    );
  }
);

SearchableSelect.displayName = 'SearchableSelect';

// =============================================================================
// TABS COMPONENT
// =============================================================================

interface TabItem {
  key: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
  icon?: ReactNode;
  badge?: string | number;
}

interface TabsProps {
  items: TabItem[];
  defaultTab?: string;
  onChange?: (key: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  defaultTab,
  onChange,
  variant = 'default',
  size = 'md',
  className,
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const variantClasses = {
    default: {
      list: 'border-b border-gray-200',
      tab: 'border-b-2 border-transparent hover:border-gray-300 hover:text-gray-700',
      activeTab: 'border-primary-500 text-primary-600',
    },
    pills: {
      list: 'bg-gray-100 p-1 rounded-lg',
      tab: 'rounded-md hover:bg-white hover:shadow-sm',
      activeTab: 'bg-white shadow-sm text-primary-600',
    },
    underline: {
      list: '',
      tab: 'border-b-2 border-transparent hover:border-gray-300',
      activeTab: 'border-primary-500 text-primary-600',
    },
  };

  return (
    <div className={cn('w-full', className)}>
      <Tab.Group defaultIndex={items.findIndex(item => item.key === defaultTab)} onChange={(index) => onChange?.(items[index].key)}>
        <Tab.List className={cn('flex space-x-1', variantClasses[variant].list)}>
          {items.map((item) => (
            <Tab
              key={item.key}
              disabled={item.disabled}
              className={({ selected }) =>
                cn(
                  'flex items-center font-medium leading-5 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200',
                  sizeClasses[size],
                  variantClasses[variant].tab,
                  selected ? variantClasses[variant].activeTab : 'text-gray-500',
                  item.disabled && 'opacity-50 cursor-not-allowed'
                )
              }
            >
              {item.icon && <span className="mr-2">{item.icon}</span>}
              {item.label}
              {item.badge && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {item.badge}
                </span>
              )}
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels className="mt-4">
          {items.map((item) => (
            <Tab.Panel
              key={item.key}
              className="focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-md"
            >
              {item.content}
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

// =============================================================================
// ACCORDION/DISCLOSURE COMPONENT
// =============================================================================

interface AccordionItem {
  key: string;
  title: string;
  content: ReactNode;
  disabled?: boolean;
  icon?: ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
  defaultOpen?: string[];
  className?: string;
}

export const Accordion: React.FC<AccordionProps> = ({
  items,
  allowMultiple = false,
  defaultOpen = [],
  className,
}) => {
  const [openItems, setOpenItems] = useState<string[]>(defaultOpen);

  const toggleItem = (key: string) => {
    if (allowMultiple) {
      setOpenItems(prev => 
        prev.includes(key) 
          ? prev.filter(item => item !== key)
          : [...prev, key]
      );
    } else {
      setOpenItems(prev => prev.includes(key) ? [] : [key]);
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {items.map((item) => (
        <Disclosure key={item.key} defaultOpen={openItems.includes(item.key)}>
          {({ open }) => (
            <div className="border border-gray-200 rounded-lg">
              <Disclosure.Button
                className="flex w-full justify-between items-center px-4 py-3 text-left text-sm font-medium text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={item.disabled}
                onClick={() => toggleItem(item.key)}
              >
                <div className="flex items-center">
                  {item.icon && <span className="mr-3">{item.icon}</span>}
                  <span>{item.title}</span>
                </div>
                <ChevronRightIcon
                  className={cn(
                    'h-5 w-5 text-gray-500 transition-transform duration-200',
                    open && 'rotate-90'
                  )}
                />
              </Disclosure.Button>
              <Transition
                enter="transition duration-100 ease-out"
                enterFrom="transform scale-95 opacity-0"
                enterTo="transform scale-100 opacity-100"
                leave="transition duration-75 ease-out"
                leaveFrom="transform scale-100 opacity-100"
                leaveTo="transform scale-95 opacity-0"
              >
                <Disclosure.Panel className="px-4 pb-3 pt-1 text-sm text-gray-700 border-t border-gray-200">
                  {item.content}
                </Disclosure.Panel>
              </Transition>
            </div>
          )}
        </Disclosure>
      ))}
    </div>
  );
};

// =============================================================================
// POPOVER COMPONENT
// =============================================================================

interface PopoverProps {
  trigger: ReactNode;
  content: ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const PopoverComponent: React.FC<PopoverProps> = ({
  trigger,
  content,
  placement = 'bottom',
  className,
}) => {
  const placementClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2',
  };

  return (
    <Popover className={cn('relative', className)}>
      <Popover.Button as="div">
        {trigger}
      </Popover.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <Popover.Panel className={cn(
          'absolute z-popover w-screen max-w-sm px-4 sm:px-0',
          placementClasses[placement]
        )}>
          <div className="overflow-hidden rounded-lg shadow-lg ring-1 ring-black ring-opacity-5">
            <div className="bg-white p-4">
              {content}
            </div>
          </div>
        </Popover.Panel>
      </Transition>
    </Popover>
  );
};

// =============================================================================
// RADIO GROUP COMPONENT
// =============================================================================

interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface RadioGroupProps {
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  name?: string;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export const RadioGroupComponent: React.FC<RadioGroupProps> = ({
  options,
  value,
  onChange,
  name,
  orientation = 'vertical',
  className,
}) => {
  return (
    <RadioGroup value={value} onChange={onChange} className={className}>
      <RadioGroup.Label className="sr-only">{name}</RadioGroup.Label>
      <div className={cn(
        'space-y-2',
        orientation === 'horizontal' && 'flex space-x-4 space-y-0'
      )}>
        {options.map((option) => (
          <RadioGroup.Option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            className={({ active, checked }) =>
              cn(
                'relative flex cursor-pointer rounded-lg px-5 py-4 shadow-md focus:outline-none',
                active ? 'ring-2 ring-primary-500 ring-offset-2' : '',
                checked ? 'bg-primary-100 border-primary-500' : 'bg-white border-gray-300',
                option.disabled && 'opacity-50 cursor-not-allowed',
                'border'
              )
            }
          >
            {({ active, checked }) => (
              <>
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center">
                    <div className="text-sm">
                      <RadioGroup.Label
                        as="p"
                        className={cn(
                          'font-medium',
                          checked ? 'text-primary-900' : 'text-gray-900'
                        )}
                      >
                        {option.label}
                      </RadioGroup.Label>
                      {option.description && (
                        <RadioGroup.Description
                          as="span"
                          className={cn(
                            'inline',
                            checked ? 'text-primary-700' : 'text-gray-500'
                          )}
                        >
                          {option.description}
                        </RadioGroup.Description>
                      )}
                    </div>
                  </div>
                  {checked && (
                    <div className="shrink-0 text-primary-600">
                      <CheckIcon className="h-6 w-6" />
                    </div>
                  )}
                </div>
              </>
            )}
          </RadioGroup.Option>
        ))}
      </div>
    </RadioGroup>
  );
};

// =============================================================================
// TOGGLE/SWITCH COMPONENT
// =============================================================================

interface ToggleProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  description?: string;
  className?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  checked = false,
  onChange,
  disabled = false,
  size = 'md',
  label,
  description,
  className,
}) => {
  const sizeClasses = {
    sm: {
      switch: 'h-4 w-7',
      thumb: 'h-3 w-3',
      translate: 'translate-x-3',
    },
    md: {
      switch: 'h-6 w-11',
      thumb: 'h-5 w-5',
      translate: 'translate-x-5',
    },
    lg: {
      switch: 'h-8 w-14',
      thumb: 'h-7 w-7',
      translate: 'translate-x-6',
    },
  };

  return (
    <Switch.Group>
      <div className={cn('flex items-center', className)}>
        <Switch
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className={cn(
            'relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
            checked ? 'bg-primary-600' : 'bg-gray-200',
            disabled && 'opacity-50 cursor-not-allowed',
            sizeClasses[size].switch
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              'pointer-events-none inline-block rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out',
              checked ? sizeClasses[size].translate : 'translate-x-0',
              sizeClasses[size].thumb
            )}
          />
        </Switch>
        {(label || description) && (
          <div className="ml-3">
            {label && (
              <Switch.Label as="span" className="text-sm font-medium text-gray-900 cursor-pointer">
                {label}
              </Switch.Label>
            )}
            {description && (
              <Switch.Description as="span" className="text-sm text-gray-500">
                {description}
              </Switch.Description>
            )}
          </div>
        )}
      </div>
    </Switch.Group>
  );
};

// =============================================================================
// DROPDOWN MENU COMPONENT
// =============================================================================

interface MenuItem {
  key: string;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  icon?: ReactNode;
  href?: string;
  divider?: boolean;
}

interface DropdownMenuProps {
  trigger: ReactNode;
  items: MenuItem[];
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
  className?: string;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  trigger,
  items,
  placement = 'bottom-start',
  className,
}) => {
  const placementClasses = {
    'bottom-start': 'left-0 mt-2',
    'bottom-end': 'right-0 mt-2',
    'top-start': 'left-0 bottom-full mb-2',
    'top-end': 'right-0 bottom-full mb-2',
  };

  return (
    <Menu as="div" className={cn('relative inline-block text-left', className)}>
      <Menu.Button as="div">
        {trigger}
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className={cn(
          'absolute z-dropdown w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none',
          placementClasses[placement]
        )}>
          <div className="py-1">
            {items.map((item) => (
              <Fragment key={item.key}>
                {item.divider ? (
                  <div className="border-t border-gray-100 my-1" />
                ) : (
                  <Menu.Item disabled={item.disabled}>
                    {({ active }) => (
                      <button
                        onClick={item.onClick}
                        className={cn(
                          'group flex w-full items-center px-4 py-2 text-sm',
                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                          item.disabled && 'opacity-50 cursor-not-allowed'
                        )}
                        disabled={item.disabled}
                      >
                        {item.icon && (
                          <span className="mr-3 flex-shrink-0">{item.icon}</span>
                        )}
                        {item.label}
                      </button>
                    )}
                  </Menu.Item>
                )}
              </Fragment>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

// =============================================================================
// EXPORTS
// =============================================================================

export {
  Select,
  SearchableSelect,
  Tabs,
  Accordion,
  PopoverComponent as Popover,
  RadioGroupComponent as RadioGroup,
  Toggle,
  DropdownMenu,
};

// Export types for external use
export type {
  SelectOption,
  SelectProps,
  ComboboxProps,
  TabItem,
  TabsProps,
  AccordionItem,
  AccordionProps,
  PopoverProps,
  RadioOption,
  RadioGroupProps,
  ToggleProps,
  MenuItem,
  DropdownMenuProps,
};
