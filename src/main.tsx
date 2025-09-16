import { setupL10N, t } from "./libs/l10n"
import { CursorData, EditorArg, ViewPanel } from "./orca"
import zhCN from "./translations/zhCN"

let pluginName: string

export async function load(_name: string) {
  pluginName = _name

  // Your plugin code goes here.
  setupL10N(orca.state.locale, { "zh-CN": zhCN })

  orca.themes.injectCSSResource(`${pluginName}/dist/styles.css`, pluginName)

  document.addEventListener("selectionchange", handleHiddenText)
  document.addEventListener("mouseover", onMouseOver)
  document.addEventListener("mouseout", onMouseOut)

  if (orca.state.commands["kef.editor.formatHideText"] == null) {
    orca.commands.registerEditorCommand(
      "core.editor.formatHideText",
      formatHideText,
      () => {},
      { label: t("Hide the selected text") },
    )
  }

  if (orca.state.toolbarButtons["kef.h"] == null) {
    orca.toolbar.registerToolbarButton("kef.h", {
      icon: "ti ti-eye-closed",
      tooltip: t("Hide text"),
      command: "kef.editor.formatHideText",
    })
  }

  console.log(`${pluginName} loaded.`)
}

export async function unload() {
  // Clean up any resources used by the plugin here.
  orca.commands.unregisterEditorCommand("core.editor.formatHideText")
  orca.toolbar.unregisterToolbarButton("kef.h")
  orca.themes.removeCSSResources(pluginName)

  document.removeEventListener("selectionchange", handleHiddenText)
  document.removeEventListener("mouseover", onMouseOver)
  document.removeEventListener("mouseout", onMouseOut)

  console.log(`${pluginName} unloaded.`)
}

async function formatHideText([panelId, rootBlockId, cursor]: EditorArg) {
  if (cursor == null) return null

  const panel = orca.nav.findViewPanel(panelId, orca.state.panels)
  if (panel == null) return null

  if (cursor.anchor === cursor.focus) {
    await toggleFormat(cursor, panel, "h")
  } else {
    await panel.viewState.editor.invokeCommand(
      "core.editor.formatSelectedText",
      cursor,
      "h",
    )
  }

  return null
}

async function toggleFormat(
  cursor: CursorData,
  panel: ViewPanel,
  format: string,
  fa?: Record<string, any>,
) {
  const selection = document.getSelection()!
  const anchorEl =
    selection.anchorNode?.nodeType === Node.ELEMENT_NODE
      ? (selection.anchorNode as HTMLElement)
      : selection.anchorNode?.parentElement
  if (
    anchorEl &&
    anchorEl.classList.contains("orca-inline") &&
    anchorEl.classList.contains(format)
  ) {
    await panel.viewState.editor.invokeCommand(
      "core.editor.insertFragments",
      cursor,
      [{ t: "t", v: "\u200B" }],
      true,
    )
    selection.collapseToStart()
  } else {
    await panel.viewState.editor.invokeCommand(
      "core.editor.insertFragments",
      cursor,
      [{ t: "t", v: "\u200B", f: format, ...(fa ? { fa } : {}) }],
    )
    selection.collapseToStart()
  }
}

function handleHiddenText() {
  const selection = document.getSelection()!
  if (selection.type !== "Caret") return

  // Remove editing class from all hidden text elements
  const allHiddenTexts = document.querySelectorAll(
    ".orca-inline.h.orca-hidden-text-editing",
  )
  for (const el of allHiddenTexts) {
    el.classList.remove("orca-hidden-text-editing")
  }

  const anchorEl =
    selection.anchorNode?.nodeType === Node.ELEMENT_NODE
      ? (selection.anchorNode as HTMLElement)
      : selection.anchorNode?.parentElement

  if (
    !anchorEl?.classList.contains("orca-inline") ||
    !anchorEl.classList.contains("h")
  )
    return

  // Find all consecutive hidden text elements
  const hiddenTextGroup: HTMLElement[] = []

  // Add current element
  hiddenTextGroup.push(anchorEl)

  // Find previous consecutive hidden text elements
  let prevEl = anchorEl.previousElementSibling as HTMLElement
  while (
    prevEl &&
    prevEl.classList.contains("orca-inline") &&
    prevEl.classList.contains("h")
  ) {
    hiddenTextGroup.unshift(prevEl)
    prevEl = prevEl.previousElementSibling as HTMLElement
  }

  // Find next consecutive hidden text elements
  let nextEl = anchorEl.nextElementSibling as HTMLElement
  while (
    nextEl &&
    nextEl.classList.contains("orca-inline") &&
    nextEl.classList.contains("h")
  ) {
    hiddenTextGroup.push(nextEl)
    nextEl = nextEl.nextElementSibling as HTMLElement
  }

  // Add editing class to all elements in the group
  for (const el of hiddenTextGroup) {
    el.classList.add("orca-hidden-text-editing")
  }
}

function onMouseOver(e: MouseEvent) {
  let target = e.target as HTMLElement
  if (
    target.parentElement?.classList.contains("orca-inline") &&
    target.parentElement?.classList.contains("h")
  ) {
    target = target.parentElement
  }
  if (
    target?.classList.contains("orca-inline") &&
    target.classList.contains("h")
  ) {
    // Find all consecutive hidden text elements
    const hiddenTextGroup: HTMLElement[] = []

    // Add current element
    hiddenTextGroup.push(target)

    // Find previous consecutive hidden text elements
    let prevEl = target.previousElementSibling as HTMLElement
    while (
      prevEl &&
      prevEl.classList.contains("orca-inline") &&
      prevEl.classList.contains("h")
    ) {
      hiddenTextGroup.unshift(prevEl)
      prevEl = prevEl.previousElementSibling as HTMLElement
    }

    // Find next consecutive hidden text elements
    let nextEl = target.nextElementSibling as HTMLElement
    while (
      nextEl &&
      nextEl.classList.contains("orca-inline") &&
      nextEl.classList.contains("h")
    ) {
      hiddenTextGroup.push(nextEl)
      nextEl = nextEl.nextElementSibling as HTMLElement
    }

    // Add hover class to all elements in the group
    for (const el of hiddenTextGroup) {
      el.classList.add("orca-hidden-text-hovering")
    }
  }
}

function onMouseOut(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (
    target?.classList.contains("orca-inline") &&
    target.classList.contains("h")
  ) {
    // Remove hover class from all hidden text elements
    const allHoveringTexts = document.querySelectorAll(
      ".orca-inline.h.orca-hidden-text-hovering",
    )
    for (const el of allHoveringTexts) {
      el.classList.remove("orca-hidden-text-hovering")
    }
  }
}
