import { store } from '@things-factory/shell'
import { addRoutingType } from '@things-factory/menu-base'

import { registerEditor, registerRenderer, TextRenderer } from '@things-factory/grist-ui'

import { ObjectRenderer } from './data-grist/renderers/object-renderer'
import { ObjectEditor } from './data-grist/editors/object-editor'
import { CodeEditor } from './data-grist/editors/code-editor'

export default function bootstrap() {
  registerRenderer('object', ObjectRenderer)
  registerEditor('object', ObjectEditor)
  registerRenderer('code', TextRenderer)
  registerEditor('code', CodeEditor)

  store.dispatch(addRoutingType('RESOURCE', 'resource'))
}
