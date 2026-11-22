export const customerService = {
  async list() { return []; },
  async save<T>(data: T) { return data; },
  async remove(id: string) { return id; }
};
