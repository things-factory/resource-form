export default function route(page) {
  switch (page) {
    case 'resource':
      import('./pages/resource-ui')
      return page
  }
}
