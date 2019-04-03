import { UPDATE_RESOURCE_FORM } from '../actions/main'

const INITIAL_STATE = {
  state_main: 'ABC'
}

const main = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case UPDATE_RESOURCE_FORM:
      return { ...state }

    default:
      return state
  }
}

export default main
