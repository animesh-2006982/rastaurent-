export function subscribeToCollection<T>(_collection: string, callback: (data: T[]) => void) {
  callback([]);
  return () => {};
}
