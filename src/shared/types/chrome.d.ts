declare namespace chrome {
  namespace runtime {
    const onInstalled: {
      addListener(callback: () => void): void
    }
  }

  namespace storage {
    namespace local {
      function get(
        keys: string | string[] | Record<string, unknown> | null,
        callback: (items: Record<string, unknown>) => void,
      ): void

      function set(items: Record<string, unknown>, callback?: () => void): void

      function remove(keys: string | string[], callback?: () => void): void
    }
  }
}
