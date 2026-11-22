export const employeeService = {
  async list() { return []; },
  async save<T>(data: T) { return data; },
  async remove(id: string) { return id; }
};
