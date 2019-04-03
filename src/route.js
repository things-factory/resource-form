export default function route(page) {
  switch (page) {
    case 'resource-form-main':
      import('./pages/main')
      return true
  }
}
