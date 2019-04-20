export default function route(page) {
  switch (page) {
    case 'resource-form':
      import('./pages/resource-form')
      return page
  }
}
