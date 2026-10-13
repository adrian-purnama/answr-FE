/**
 * Flatten / tree helpers for MCP JSON Schema (field maps + OUT schema UI).
 * Unwraps anyOf / oneOf / allOf (common for Zod .optional() / .nullable()).
 */

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

/** Expand union / intersection wrappers into concrete schema nodes. */
export function schemaBranches(def: unknown): Record<string, unknown>[] {
  const record = asRecord(def)
  if (!record) return []

  const out: Record<string, unknown>[] = []
  for (const key of ['anyOf', 'oneOf', 'allOf'] as const) {
    const arr = record[key]
    if (!Array.isArray(arr)) continue
    for (const item of arr) {
      const nested = schemaBranches(item)
      if (nested.length > 0) out.push(...nested)
      else {
        const branch = asRecord(item)
        if (branch) out.push(branch)
      }
    }
  }
  if (out.length > 0) return out
  return [record]
}

/** Prefer an object schema that actually declares properties. */
export function objectSchemaWithProperties(
  def: unknown,
): Record<string, unknown> | null {
  for (const branch of schemaBranches(def)) {
    const props = branch.properties
    if (props && typeof props === 'object' && !Array.isArray(props)) {
      return branch
    }
    if (branch.items) {
      for (const item of schemaBranches(branch.items)) {
        if (
          item.properties &&
          typeof item.properties === 'object' &&
          !Array.isArray(item.properties)
        ) {
          return item
        }
      }
    }
  }
  return null
}

/** True when the schema (or a branch) describes an array. */
function isArraySchema(def: unknown): boolean {
  for (const branch of schemaBranches(def)) {
    if (branch.type === 'array' || branch.items != null) return true
  }
  return false
}

function schemaTypeLabel(value: unknown): string {
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === 'string').join(' | ') || 'unknown'
  }
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    if (typeof record.type === 'string') return record.type
    if (objectSchemaWithProperties(record)) return 'object'
  }
  return 'unknown'
}

export type JsonSchemaTreeNode = {
  name: string
  path: string
  type: string
  required: boolean
  description?: string
  children: JsonSchemaTreeNode[]
}

function buildNodesFromProperties(
  properties: Record<string, unknown>,
  required: Set<string>,
  prefix: string,
  maxDepth: number,
): JsonSchemaTreeNode[] {
  if (maxDepth < 0) return []

  return Object.entries(properties).map(([key, def]) => {
    const path = prefix ? `${prefix}.${key}` : key
    const record = asRecord(def) ?? {}
    const nested = objectSchemaWithProperties(def)
    const nestedProps =
      nested?.properties &&
      typeof nested.properties === 'object' &&
      !Array.isArray(nested.properties)
        ? (nested.properties as Record<string, unknown>)
        : null
    const nestedRequired = new Set(
      Array.isArray(nested?.required)
        ? nested.required.filter((item): item is string => typeof item === 'string')
        : [],
    )

    const children = nestedProps
      ? buildNodesFromProperties(nestedProps, nestedRequired, path, maxDepth - 1)
      : []

    // Prefer concrete type from object branch when present
    let type = schemaTypeLabel(record.type ?? record)
    for (const branch of schemaBranches(def)) {
      if (typeof branch.type === 'string' && branch.type !== 'null') {
        type = branch.type
        break
      }
      if (branch.properties) {
        type = 'object'
        break
      }
    }

    return {
      name: key,
      path,
      type,
      required: required.has(key),
      description:
        typeof record.description === 'string'
          ? record.description
          : typeof nested?.description === 'string'
            ? nested.description
            : undefined,
      children,
    }
  })
}

/** Nested tree for collapsible OUT schema UI. */
export function buildJsonSchemaTree(
  schema: unknown,
  maxDepth = 6,
): JsonSchemaTreeNode[] {
  const root = objectSchemaWithProperties(schema) ?? asRecord(schema)
  if (!root) return []
  const properties = root.properties
  if (!properties || typeof properties !== 'object' || Array.isArray(properties)) {
    return []
  }
  const required = new Set(
    Array.isArray(root.required)
      ? root.required.filter((item): item is string => typeof item === 'string')
      : [],
  )
  return buildNodesFromProperties(
    properties as Record<string, unknown>,
    required,
    '',
    maxDepth,
  )
}

/** Leaf dotted paths for field-map chips / variables list. */
export function flattenJsonSchemaPaths(
  schema: unknown,
  prefix = '',
  maxDepth = 6,
): string[] {
  if (maxDepth < 0) return []

  const root = objectSchemaWithProperties(schema) ?? asRecord(schema)
  if (!root) return []

  const properties = root.properties
  if (!properties || typeof properties !== 'object' || Array.isArray(properties)) {
    return []
  }

  const paths: string[] = []
  for (const [key, def] of Object.entries(
    properties as Record<string, unknown>,
  )) {
    if (!key) continue
    const path = prefix ? `${prefix}.${key}` : key
    const nestedObject = objectSchemaWithProperties(def)

    if (nestedObject?.properties) {
      const childPaths = flattenJsonSchemaPaths(nestedObject, path, maxDepth - 1)
      if (childPaths.length > 0) {
        // Emit array path for table bindRows / chart bindSeries mapping.
        if (isArraySchema(def)) {
          paths.push(path)
        }
        paths.push(...childPaths)
        continue
      }
    }

    paths.push(path)
  }

  return paths
}
