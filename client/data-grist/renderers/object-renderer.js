import { html } from 'lit-html'

export const ObjectRenderer = (value, column, record, rowIndex, field) => {
  if (!value) {
    return ''
  }

  var { nameField = 'name', descriptionField = 'description' } = column.record.options || {}

  return html`
    ${value[nameField] || ''}(${value[descriptionField] || ''})
  `
}
