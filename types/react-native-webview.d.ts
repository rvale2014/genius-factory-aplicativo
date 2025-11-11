declare module "react-native-webview" {
  import * as React from "react";
    import {
        NativeSyntheticEvent,
        StyleProp,
        ViewProps,
        ViewStyle,
    } from "react-native";

  export type WebViewMessageEvent = NativeSyntheticEvent<{ data: string }>;

  export interface WebViewSource {
    html?: string;
    uri?: string;
    baseUrl?: string;
  }

  export interface WebViewProps extends ViewProps {
    source?: WebViewSource;
    originWhitelist?: string[];
    onMessage?: (event: WebViewMessageEvent) => void;
    javaScriptEnabled?: boolean;
    containerStyle?: StyleProp<ViewStyle>;
    style?: StyleProp<ViewStyle>;
    [key: string]: any;
  }

  export interface WebViewHandle {
    postMessage(data: string): void;
    reload(): void;
    stopLoading(): void;
    goBack(): void;
    goForward(): void;
  }

  export class WebView extends React.Component<WebViewProps> {
    postMessage(data: string): void;
    reload(): void;
    stopLoading(): void;
    goBack(): void;
    goForward(): void;
  }

  export default WebView;
}

