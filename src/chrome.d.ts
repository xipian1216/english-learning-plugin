declare namespace chrome {
    namespace runtime {
        function onInstalledAddListener(callback: () => void): void

        const onInstalled: {
            addListener(callback: () => void): void
        }
    }
}
