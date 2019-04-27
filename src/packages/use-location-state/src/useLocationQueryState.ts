import {
  QueryStateOpts,
  SetQueryStateFn,
  SetQueryStateItemFn,
  SetQueryStringOptions,
  ValueType,
} from './types'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createMergedQuery, parseQueryState, QueryState } from 'query-state-core'
import { QueryStateMerge, QueryStateValue } from 'query-state-core/src/query-state-core'

export function useLocationQueryStateObj<T extends QueryState>(
  defaultQueryState: T,
  queryStateOpts: QueryStateOpts
): [QueryState, SetQueryStateFn<T>] {
  const { queryStringInterface } = queryStateOpts
  const queryString = queryStringInterface.getQueryString()
  const [, setLatestMergedQueryString] = useState<string>()
  const queryState = useMemo(
    () => ({
      ...defaultQueryState,
      ...parseQueryState(queryString),
    }),
    [defaultQueryState, queryString]
  )

  const ref = useRef({
    defaultQueryState,
    queryStateOpts,
  })

  const setQueryState: SetQueryStateFn<T> = useCallback((newState, opts) => {
    const { defaultQueryState, queryStateOpts } = ref.current
    const { queryStringInterface, stripDefaults = true } = queryStateOpts
    const stripOverwrite: QueryStateMerge = {}

    // when a params are set to the same value as in the defaults
    // we remove them to avoid having two URLs reproducing the same state unless stripDefaults === false
    if (stripDefaults) {
      Object.entries(newState).forEach(([key]) => {
        if (defaultQueryState[key] === newState[key]) {
          stripOverwrite[key] = null
        }
      })
    }

    // retrieve the last value (by re-executing the search getter)
    const currentQueryState: QueryState = {
      ...defaultQueryState,
      ...parseQueryState(queryStringInterface.getQueryString()),
    }

    const mergedQueryString = createMergedQuery(currentQueryState || {}, newState, stripOverwrite)

    queryStringInterface.setQueryString(mergedQueryString, opts || {})

    // triggers an update (in case the QueryStringInterface misses to do so)
    setLatestMergedQueryString(mergedQueryString)
  }, [])

  useEffect(() => {
    ref.current = {
      defaultQueryState,
      queryStateOpts,
    }
  })

  return [queryState, setQueryState]
}

export function useLocationQueryState<T>(
  itemName: string,
  defaultValue: T,
  queryStateOpts: QueryStateOpts
): [T, SetQueryStateItemFn<T>] {
  const defaultQueryStateValue = toQueryStateValue(defaultValue)

  const defaultQueryState = useMemo(() => {
    return defaultQueryStateValue
      ? {
          [itemName]: defaultQueryStateValue,
        }
      : {}
  }, [itemName, defaultQueryStateValue])

  const [queryState, setQueryState] = useLocationQueryStateObj(defaultQueryState, queryStateOpts)

  const setQueryStateItem: SetQueryStateItemFn<T> = useCallback(
    (newValue, opts) => {
      setQueryState({ [itemName]: toQueryStateValue(newValue) }, opts)
    },
    [itemName, setQueryState]
  )

  // fallback to default value
  const queryStateItem = queryState[itemName]
  const queryStateValue = parseQueryStateValue(queryStateItem, defaultValue)
  let value = defaultValue

  if(queryStateValue !== null && typeof queryStateValue === typeof defaultValue) {
    value = queryStateValue as any
  }

  return [value, setQueryStateItem]
}

function toQueryStateValue(value: ValueType | any): QueryStateValue | null {
  if (Array.isArray(value)) {
    return value.map(v => v.toString()).sort()
  } else if (value || value === '' || value === false || value === 0) {
    return value.toString()
  } else {
    return null
  }
}

function parseQueryStateValue<T>(value: QueryStateValue, defaultValue: T) {
  const defaultValueType = typeof defaultValue

  if (defaultValueType === 'object' && Array.isArray(defaultValue)) {
    const sArr: string[] = []
    const ret = sArr.concat(value)
    return ret
  }

  switch (defaultValueType) {
    case 'string':
      return value.toString()
    case 'number':
      const num = Number(value)
      return num || num === 0 ? num : null
    case 'boolean':
      if (value === 'true') {
        return true
      } else if (value === 'false') {
        return false
      } else {
        return null
      }
    default:
      return null
  }
}
