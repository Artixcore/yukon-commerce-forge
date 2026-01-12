import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronRight } from "lucide-react";
import { CategoryTree } from "@/lib/categoryUtils";
import { cn } from "@/lib/utils";

interface CategoryDropdownProps {
  category: CategoryTree;
  isMobile?: boolean;
}

export const CategoryDropdown = ({ category, isMobile = false }: CategoryDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Calculate dropdown position relative to trigger
  const updatePosition = () => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // For mobile, use full-width dropdown positioned below navbar
    if (isMobile) {
      setPosition({
        top: rect.bottom + 4,
        left: 0,
        width: viewportWidth,
      });
    } else {
      // For desktop, align with trigger but handle edge cases
      let left = rect.left;
      const dropdownWidth = 280; // max-w-[280px]
      
      // If dropdown would overflow right edge, align to right
      if (left + dropdownWidth > viewportWidth - 16) {
        left = viewportWidth - dropdownWidth - 16;
      }
      
      // Ensure minimum left margin
      if (left < 16) {
        left = 16;
      }
      
      setPosition({
        top: rect.bottom + 4,
        left,
        width: Math.max(rect.width, 200),
      });
    }
  };

  // Handle open with position calculation
  const handleOpen = () => {
    updatePosition();
    setIsOpen(true);
  };

  // Handle close with delay for hover behavior
  const handleClose = (immediate = false) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (immediate) {
      setIsOpen(false);
    } else {
      // Small delay for hover behavior
      timeoutRef.current = setTimeout(() => {
        setIsOpen(false);
      }, 150);
    }
  };

  // Desktop: hover behavior
  const handleMouseEnter = () => {
    if (!isMobile) {
      handleOpen();
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      handleClose();
    }
  };

  // Mobile: click behavior
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isMobile) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        updatePosition();
      }
    }
  };

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    const handleScroll = () => setIsOpen(false);
    const handleResize = () => {
      if (isOpen) {
        updatePosition();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen, isMobile]);

  // Update position when open state changes
  useEffect(() => {
    if (isOpen) {
      updatePosition();
    }
  }, [isOpen, isMobile]);

  // Render subcategory recursively
  const renderSubcategory = (subcategory: CategoryTree, level: number = 0): JSX.Element => {
    const hasChildren = subcategory.children.length > 0;
    const paddingLeft = level > 0 ? `${level * 12}px` : undefined;

    return (
      <li key={subcategory.id} style={{ paddingLeft }}>
        <Link
          to={`/shop?category=${subcategory.id}`}
          className="flex items-center justify-between px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-primary rounded-md transition-colors group"
          onClick={() => setIsOpen(false)}
        >
          <span>{subcategory.name}</span>
          {hasChildren && <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />}
        </Link>
        {hasChildren && (
          <ul className="ml-2 mt-1 space-y-1">
            {subcategory.children.map((child) => renderSubcategory(child, level + 1))}
          </ul>
        )}
      </li>
    );
  };

  const hasSubcategories = category.children.length > 0;

  if (!hasSubcategories) {
    // No dropdown needed, just a link
    return (
      <Link
        to={`/shop?category=${category.id}`}
        className="text-white hover:text-primary font-medium text-sm whitespace-nowrap px-3 py-2 hover:bg-white/10 rounded-md transition-colors"
      >
        {category.name}
      </Link>
    );
  }

  return (
    <>
      <button
        ref={triggerRef}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={cn(
          "text-white hover:text-primary font-medium text-sm whitespace-nowrap px-3 py-2 hover:bg-white/10 rounded-md transition-colors flex items-center gap-1",
          isOpen && "bg-white/10"
        )}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={`${category.name} menu`}
      >
        {category.name}
        <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
      </button>

      {/* Dropdown Panel - Portal to body */}
      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className={cn(
              "fixed z-[100] bg-background shadow-lg border border-border max-h-[80vh] overflow-y-auto",
              isMobile 
                ? "left-0 right-0 rounded-none border-t-2 border-primary" 
                : "rounded-lg min-w-[200px] max-w-[280px]"
            )}
            style={{
              top: `${position.top}px`,
              left: isMobile ? 0 : `${position.left}px`,
              width: isMobile ? "100%" : `${Math.max(position.width, 200)}px`,
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            role="menu"
            aria-orientation="vertical"
          >
            <ul className="p-2">
              {/* View All Link */}
              <li>
                <Link
                  to={`/shop?category=${category.id}`}
                  className="block px-3 py-2 text-sm font-semibold text-primary hover:bg-accent rounded-md transition-colors"
                  onClick={() => setIsOpen(false)}
                  role="menuitem"
                >
                  View All {category.name}
                </Link>
              </li>

              {/* Separator */}
              <li className="my-1 h-px bg-border" />

              {/* Subcategory Items */}
              {category.children.map((child) => renderSubcategory(child))}
            </ul>
          </div>,
          document.body
        )}
    </>
  );
};
