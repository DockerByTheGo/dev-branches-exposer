import * as fs from 'fs';
import * as path from 'path';
type JSON<T extends string>  = T extends  `${infer T}.json` ? string : never
export class JsonWriter<T extends Record<string, unknown>, Filename extends string> {
  private filePath: string;
  private data: T[];

  protected constructor(filePath: JSON<Filename>) {
    this.filePath = filePath;
    this.data = [];

    this.load();
  }

  static new<T extends Record<string, unknown>, Filename extends string>(file: JSON<Filename>): Filename extends string ? JsonWriter<T, Filename> : never{
    return new JsonWriter(file)
  }

  private load() {
    if (fs.existsSync(this.filePath)) {
      const content = fs.readFileSync(this.filePath, 'utf-8');
      this.data = JSON.parse(content) as T[];
    } else {
      this.data = [];
      this.save();
    }
  }

  private save() {
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
  }

  public create(entry: T): void {
    this.data.push(entry);
    this.save();
  }

  public update(predicate: (entry: T) => boolean, newData: Partial<T>): number {
    let updatedCount = 0;
    this.data = this.data.map(entry => {
      if (predicate(entry)) {
        updatedCount++;
        return { ...entry, ...newData };
      }
      return entry;
    });
    this.save();
    return updatedCount;
  }

  public delete(predicate: (entry: T) => boolean): number {
    const originalLength = this.data.length;
    this.data = this.data.filter(entry => !predicate(entry));
    const deletedCount = originalLength - this.data.length;
    this.save();
    return deletedCount;
  }

  public getAll(): T[] {
    return [...this.data];
  }
}
