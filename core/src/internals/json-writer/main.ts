import * as fs from 'fs';
import * as path from 'path';
import { z, type ZodRawShape } from 'zod';
import type { ZodObject } from 'zod';
import { DeploymentsJson } from '../../scehams-and-types/main';
import { homedir } from 'os';
import { tap } from '@blazyts/better-standard-library';
type IsJson<T extends string>  = T extends  `${infer T}.json` ? string : never
export class JsonWriter<T extends Record<string, unknown>, Filename extends string> {
  private filePath: string;
  private data: T[];

  protected constructor(filePath: IsJson<Filename>) {
    this.filePath = filePath;
    this.data = [];

    this.load();
  }

  static new<T extends Record<string, unknown>, Filename extends string>(file: IsJson<Filename>): Filename extends string ? JsonWriter<T, Filename> : never{
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




export class SimpleJSONWriter<
  T extends ZodObject<ZodRawShape>,
  Raw extends z.infer<T> = z.infer<T>
>{
  private object: Raw // keeping it inmemory for faster access 
  private file: string
  private schema: T
  
  private constructor(schema: T,filename: string){
    this.object = schema.parse(JSON.parse(tap(fs.readFileSync(filename, "utf-8").toString(), v => console.log(v))))
    this.schema = schema
    this.file = filename
  }

  get(): Raw{
    return this.object 
  }

  sync(){
    fs.writeFileSync(this.file, JSON.stringify(this.object))
  }
  modify(func: (v: Raw) => Raw){
    this.object = func(this.object)
    this.sync()
  }
  
  static new<
  T extends ZodObject<ZodRawShape>,
   Filename extends string,
   >(file: Filename, schema: T): IsJson<Filename> extends string
    ? SimpleJSONWriter<T>
    : never {
    return new SimpleJSONWriter(schema,file)
  }
}

export const g = SimpleJSONWriter.new(path.join(homedir(),".deploy/config.json"), DeploymentsJson)