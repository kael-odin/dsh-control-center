/** Copy dictionaries for the Control Center shell. */

export const en = {
  trigger: 'Settings',
  title: 'Settings',
  close: 'Close settings',
  generalNav: 'General',
  coreGroup: 'Core',
  nativeGroup: 'DSH native',
  otherGroup: 'DSH native / Other',
  openDocument: 'Open configuration file',
  openDocumentError: 'The configuration file could not be opened.',
}

export type SettingsKey = keyof typeof en

export const zh: { [Key in SettingsKey]: string } = {
  trigger: '设置',
  title: '设置',
  close: '关闭设置',
  generalNav: '通用',
  coreGroup: '核心',
  nativeGroup: 'DSH 原生',
  otherGroup: 'DSH 原生／其他',
  openDocument: '打开配置文件',
  openDocumentError: '暂时无法打开配置文件。',
}
