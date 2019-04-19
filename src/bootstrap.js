import { store } from '@things-factory/shell'
import { addRoutingType } from '@things-factory/base-menu'

export default function bootstrap() {
  store.dispatch(addRoutingType('RESOURCE', 'resource-form'))
}
