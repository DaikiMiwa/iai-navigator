((
  global: typeof globalThis & {
    SafariKeyboardNavigationHelp?: SafariKeyboardNavigationHelp;
  },
) => {
  const HELP_SECTIONS: readonly HelpSection[] = [
    {
      title: "Hints",
      shortcuts: [
        {
          key: "f",
          description: "Show hints for visible links and controls",
        },
        {
          key: "Shift+F",
          description: "Show link hints and open the chosen link in a new tab",
        },
        {
          key: "Esc",
          description: "Cancel hint mode",
        },
      ],
    },
    {
      title: "Page Movement",
      shortcuts: [
        {
          key: "h / j / k / l",
          description: "Scroll left, down, up, or right",
        },
        {
          key: "u / d",
          description: "Move up or down by half a page",
        },
        {
          key: "gg",
          description: "Move to the top of the page",
        },
        {
          key: "Shift+G",
          description: "Move to the bottom of the page",
        },
      ],
    },
    {
      title: "Navigation",
      shortcuts: [
        {
          key: "Shift+H",
          description: "Go back in tab history",
        },
        {
          key: "Shift+L",
          description: "Go forward in tab history",
        },
        {
          key: "Shift+J",
          description: "Switch to the tab on the left",
        },
        {
          key: "Shift+K",
          description: "Switch to the tab on the right",
        },
      ],
    },
    {
      title: "Utilities",
      shortcuts: [
        {
          key: "r",
          description: "Reload the current page",
        },
        {
          key: "yy",
          description: "Copy the current page URL",
        },
        {
          key: "?",
          description: "Show this keyboard shortcut help",
        },
        {
          key: "Esc",
          description: "Blur a focused text field",
        },
      ],
    },
  ];

  function isHelpCommandEvent(event: KeyboardEvent): boolean {
    return (
      !event.defaultPrevented &&
      !event.repeat &&
      !event.isComposing &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      event.key === "?"
    );
  }

  function isHelpCloseCommandEvent(event: KeyboardEvent): boolean {
    return (
      !event.defaultPrevented &&
      !event.isComposing &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      event.key === "Escape"
    );
  }

  global.SafariKeyboardNavigationHelp = {
    HELP_SECTIONS,
    isHelpCommandEvent,
    isHelpCloseCommandEvent,
  };
})(globalThis);
