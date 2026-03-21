import React from "react";
import { render } from "@testing-library/react-native";
import ScannerScreen from "./ScannerScreen";

// Mock the camera and OCR modules
jest.mock("react-native-vision-camera", () => ({
  Camera: jest.fn().mockImplementation(() => ({
    takePicture: jest.fn().mockResolvedValue({ uri: "test-uri" }),
    requestCameraPermission: jest.fn().mockResolvedValue("authorized"),
  })),
}));

jest.mock("react-native-tesseract-ocr", () => ({
  recognize: jest.fn().mockResolvedValue({
    text: "John Doe\njohn.doe@example.com\n+1-555-123-4567\nAcme Inc.",
  }),
}));

jest.mock("../utils/storage", () => ({
  addContact: jest.fn(),
}));

jest.mock("../utils/exportUtils", () => ({
  exportContactAsVCard: jest.fn().mockResolvedValue(true),
}));

jest.mock("../utils/errorHandler", () => ({
  showErrorAlert: jest.fn(),
}));

describe("ScannerScreen", () => {
  it("renders without crashing", () => {
    const { getByText } = render(<ScannerScreen />);
    expect(getByText(/Requesting camera permission/i)).toBeTruthy();
  });
});
