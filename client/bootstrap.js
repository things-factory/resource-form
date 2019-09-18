import { store } from '@things-factory/shell'
import { addRoutingType } from '@things-factory/menu-base'

import { registerEditor, registerRenderer } from '@things-factory/grist-ui'

import { ObjectRenderer } from './data-grist/renderers/object-renderer'
import { ObjectEditor } from './data-grist/editors/object-editor'

export default function bootstrap() {
  registerRenderer('object', ObjectRenderer)
  registerEditor('object', ObjectEditor)

  store.dispatch(addRoutingType('RESOURCE', 'resource'))
}
