import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const sourcePath = resolve(scriptDirectory, '../../contracts/src/alpaca.d.ts')
const databaseSchemaPath = resolve(scriptDirectory, '../src/schema.ts')

const source = await readFile(sourcePath, 'utf8')
const databaseSchema = await readFile(databaseSchemaPath, 'utf8')
const root = process.argv.slice(2).find((argument) => argument !== '--')

if (!root) {
  throw new Error('Usage: pnpm db:add-schema <alpaca-schema-name>')
}

const schemaDeclarationPattern = /^        ([A-Za-z0-9_$]+):/gm
const schemaReferencePattern = /components\["schemas"\]\["([A-Za-z0-9_$]+)"\]/g
const declarations = [...source.matchAll(schemaDeclarationPattern)]
const schemas = new Map()

for (const [index, declaration] of declarations.entries()) {
  const name = declaration[1]
  const start = declaration.index + declaration[0].length
  const end = declarations[index + 1]?.index ?? source.length
  const body = source.slice(start, end)
  const fields = [...body.matchAll(/^            ([A-Za-z0-9_$]+)(\?)?:\s*([^;]+);/gm)]
  schemas.set(name, {
    isObject: body.trimStart().startsWith('{'),
    fields: fields.map((field) => ({
      name: field[1],
      optional: Boolean(field[2]),
      type: field[3].trim(),
    })),
    references: [...body.matchAll(schemaReferencePattern)].map((reference) => reference[1]),
  })
}

const rootSchema = schemas.get(root)
if (!rootSchema) {
  throw new Error(`Unknown Alpaca schema: ${root}`)
}
if (!rootSchema.isObject) {
  throw new Error(`${root} is a scalar schema and cannot become a table`)
}

const tableNamePattern = /export const ([A-Za-z0-9_$]+)\s*=\s*pgTable\("([^"]+)"/g
const tables = new Map([...databaseSchema.matchAll(tableNamePattern)].map((match) => [match[2], match[1]]))
const visited = new Set()
const objectSchemas = []

const visit = (name) => {
  if (visited.has(name)) return
  visited.add(name)

  const schema = schemas.get(name)
  if (!schema) return
  for (const reference of schema.references) {
    if (schemas.get(reference)?.isObject) visit(reference)
  }
  if (schema.isObject) objectSchemas.push(name)
}

visit(root)

const toIdentifier = (name) => name.replace(/_([a-z])/g, (_, character) => character.toUpperCase())
const quote = (value) => JSON.stringify(value)
const objectSchemaNames = new Set(objectSchemas)

const columnFor = (field, schema) => {
  const reference = field.type.match(/^components\["schemas"\]\["([A-Za-z0-9_$]+)"\](\[\])?$/)
  const columnName = field.name
  let definition

  if (reference?.[2] || field.type.endsWith('[]')) {
    definition = `jsonb(${quote(columnName)})`
  } else if (reference && objectSchemaNames.has(reference[1])) {
    const referencedTable = tables.get(reference[1]) ?? toIdentifier(reference[1])
    definition = `uuid(${quote(`${columnName}_id`)}).references(() => ${referencedTable}.id)`
  } else if (field.name === 't' || reference?.[1] === 'timestamp') {
    definition = `timestamp(${quote(columnName)}, { withTimezone: true })`
  } else if (field.type.includes('boolean')) {
    definition = `boolean(${quote(columnName)})`
  } else if (field.type.includes('number')) {
    definition = `numeric(${quote(columnName)})`
  } else {
    definition = `text(${quote(columnName)})`
  }

  if (!field.optional && !definition.includes('.references')) definition += '.notNull()'
  return `    ${toIdentifier(columnName)}: ${definition},`
}

const missingTables = objectSchemas.filter((name) => !tables.has(name))
if (missingTables.length === 0) {
  console.log(`No tables to add for ${root}`)
  process.exit(0)
}

const generated = missingTables.map((name) => {
  const schema = schemas.get(name)
  const identifier = toIdentifier(name)
  const fields = schema.fields.map((field) => columnFor(field, schema))
  return `export const ${identifier} = pgTable(${quote(name)}, {\n    id: uuid('id').default(sql\`uuidv7()\`).primaryKey(),\n${fields.join('\n')}\n});\n`
}).join('\n')

let updatedSchema = databaseSchema
updatedSchema = updatedSchema.replace(
  "  boolean,\n  pgTable,",
  "  boolean,\n  jsonb,\n  numeric,\n  pgTable,",
)
updatedSchema = updatedSchema.replace(
  "  timestamp,\n  uniqueIndex,",
  "  sql,\n  timestamp,\n  uniqueIndex,\n  uuid,",
)
updatedSchema = `${updatedSchema.trimEnd()}\n\n${generated}`
await writeFile(databaseSchemaPath, updatedSchema)

console.log(`Added ${missingTables.join(', ')} to packages/db/src/schema.ts`)
