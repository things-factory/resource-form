import { store } from '@things-factory/shell'
import { addRoutingType } from '@things-factory/menu-base'

export default function bootstrap() {
  store.dispatch(addRoutingType('RESOURCE', 'resource'))
}
