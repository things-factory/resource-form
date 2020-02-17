import { html } from 'lit-html'

export const ObjectRenderer = (value, column, record, rowIndex, field) => {
  if (!value) {
    return ''
  }

  var { nameField = 'name', descriptionField = 'description' } = column.record.options || {}
  var name, description

  if (typeof nameField === 'function') {
    name = nameField(value)
  } else {
    name = value[nameField]
  }

  if (typeof descriptionField === 'function') {
    description = descriptionField(value)
  } else {
    description = value[descriptionField] && `(${value[descriptionField]})`
  }

  return html`
    ${name || ''}${description || ''}
  `
}
