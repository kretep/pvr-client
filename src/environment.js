
export function getAPIPath() {
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:8080/jdreg/';
  }
  return '/api/';
}
