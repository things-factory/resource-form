import { store } from '@things-factory/shell'
import resourceForm from './reducers/main'

export default function bootstrap() {
  store.addReducers({
    resourceForm
  })
}
