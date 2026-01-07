declare namespace MusicKit {
  interface AppConfiguration {
    build?: string
    icon?: string
    name?: string
    version?: string
  }

  interface Configuration {
    app?: AppConfiguration
    declarativeMarkup?: boolean
    developerToken?: string
    storefrontId?: string
    bitrate?: number
  }

  interface MusicKitInstance {
    authorize(): Promise<string>
    unauthorize(): Promise<void>
    isAuthorized: boolean
    storefrontId: string
    musicUserToken: string
  }

  function configure(configuration: Configuration): Promise<MusicKitInstance>
  function getInstance(): MusicKitInstance
}

