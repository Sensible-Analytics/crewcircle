/**
 * @format
 */

import "react-native";
import React from "react";
import App from "../App";

// Note: import explicitly to use the types shipped with jest.
import { it } from "@jest/globals";

// Note: test renderer must be required after react-native.
import renderer from "react-test-renderer";

jest.mock("@react-navigation/native", () => ({
  NavigationContainer: ({ children }: { children: React.ReactNode }) => {
    return children;
  },
}));

jest.mock("../src/navigation/AppNavigator", () => ({
  AppNavigator: () => {
    const { View } = await import("react-native");
    return <View testID="app-navigator" />;
  },
}));

it("renders correctly", () => {
  renderer.create(<App />);
});
