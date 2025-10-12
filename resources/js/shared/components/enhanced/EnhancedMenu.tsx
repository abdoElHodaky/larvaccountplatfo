/**
 * Enhanced Menu Component - Phase 5
 * HeadlessUI Menu enhanced with LiveIcons and TailwindCSS styling
 */

import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { 
  LiveChevronDownIcon, 
  LiveMenuToggleIcon,
  type LiveIconProps 
} from '../../icons';

interface MenuItem {
  label: string;
  onClick: () => void;
  icon?: React.ComponentType<LiveIconProps>;
  iconProps?: LiveIconProps;
  disabled?: boolean;
  danger?: boolean;
}

interface EnhancedMenuProps {
  trigger: React.ReactNode;
  items: MenuItem[];
  className?: string;
  menuClassName?: string;
  position?: 'left' | 'right';
  animated?: boolean;
  // LiveIcons integration
  triggerIcon?: React.ComponentType<LiveIconProps>;
  triggerIconProps?: LiveIconProps;
}

export const EnhancedMenu: React.FC<EnhancedMenuProps> = ({
  trigger,
  items,
  className = '',
  menuClassName = '',
  position = 'right',
  animated = true,
  triggerIcon: TriggerIcon,
  triggerIconProps = {}
}) => {
  return (
    <Menu as="div" className={`relative inline-block text-left ${className}`}>
      {({ open }) => (
        <>
          <Menu.Button className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors">
            {trigger}
            {TriggerIcon ? (
              <TriggerIcon
                size="sm"
                color="secondary"
                trigger="hover"
                className={`ml-2 transition-transform ${open ? 'rotate-180' : ''}`}
                {...triggerIconProps}
              />
            ) : (
              <LiveChevronDownIcon
                size="sm"
                color="secondary"
                trigger="hover"
                className={`ml-2 transition-transform ${open ? 'rotate-180' : ''}`}
              />
            )}
          </Menu.Button>

          <Transition
            as={Fragment}
            show={open}
            enter={animated ? "transition ease-out duration-100" : ""}
            enterFrom={animated ? "transform opacity-0 scale-95" : ""}
            enterTo={animated ? "transform opacity-100 scale-100" : ""}
            leave={animated ? "transition ease-in duration-75" : ""}
            leaveFrom={animated ? "transform opacity-100 scale-100" : ""}
            leaveTo={animated ? "transform opacity-0 scale-95" : ""}
          >
            <Menu.Items className={`
              absolute z-10 mt-2 w-56 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none
              ${position === 'left' ? 'left-0 origin-top-left' : 'right-0 origin-top-right'}
              ${menuClassName}
            `}>
              <div className="py-1">
                {items.map((item, index) => (
                  <Menu.Item key={index} disabled={item.disabled}>
                    {({ active, disabled }) => (
                      <button
                        onClick={item.onClick}
                        disabled={disabled}
                        className={`
                          group flex items-center w-full px-4 py-2 text-sm transition-colors
                          ${active && !disabled ? 'bg-gray-100 text-gray-900' : 'text-gray-700'}
                          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                          ${item.danger ? 'text-danger-600 hover:bg-danger-50' : ''}
                        `}
                      >
                        {item.icon && (
                          <item.icon
                            size="sm"
                            color={item.danger ? 'danger' : 'secondary'}
                            trigger="hover"
                            className="mr-3"
                            {...item.iconProps}
                          />
                        )}
                        {item.label}
                      </button>
                    )}
                  </Menu.Item>
                ))}
              </div>
            </Menu.Items>
          </Transition>
        </>
      )}
    </Menu>
  );
};

// Preset menu configurations
export const ActionMenu: React.FC<Omit<EnhancedMenuProps, 'items'> & {
  onEdit?: () => void;
  onDelete?: () => void;
  onCopy?: () => void;
  onShare?: () => void;
}> = ({ onEdit, onDelete, onCopy, onShare, ...props }) => {
  const items: MenuItem[] = [];

  if (onEdit) {
    items.push({
      label: 'Edit',
      onClick: onEdit,
      icon: require('../../icons/ActionIcons').LiveEditIcon
    });
  }

  if (onCopy) {
    items.push({
      label: 'Copy',
      onClick: onCopy,
      icon: require('../../icons/ActionIcons').LiveCopyIcon
    });
  }

  if (onShare) {
    items.push({
      label: 'Share',
      onClick: onShare,
      icon: require('../../icons/ActionIcons').LiveShareIcon
    });
  }

  if (onDelete) {
    items.push({
      label: 'Delete',
      onClick: onDelete,
      icon: require('../../icons/ActionIcons').LiveDeleteIcon,
      danger: true
    });
  }

  return <EnhancedMenu items={items} {...props} />;
};

