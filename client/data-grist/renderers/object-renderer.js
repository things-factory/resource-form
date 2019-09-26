import { html } from 'lit-html'

export const ObjectRenderer = (value, column, record, rowIndex, field) => {
  if (!value) {
    return ''
  }

  var { nameField = 'name', descriptionField = 'description' } = column.record.options || {}
  var name = nameField && value[nameField]
  var description = descriptionField && value[descriptionField] && `(${value[descriptionField]})`

  return html`
    ${name || ''}${description || ''}
  `
}
