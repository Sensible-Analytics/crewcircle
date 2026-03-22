// Mock all modules first
jest.mock("react-native-vision-camera");
jest.mock("rn-mlkit-ocr");
jest.mock("../utils/storage");
jest.mock("../utils/exportUtils");
jest.mock("../utils/errorHandler");

// Import the component and the showErrorAlert function after mocks are set up
import React from "react";
import { render, screen, waitFor } from "@testing-library/react-native";
import ScannerScreen from "./ScannerScreen";
const { showErrorAlert } = require("../src/utils/errorHandler");

describe("ScannerScreen", () => {
  // Set up default mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock for react-native-vision-camera
    require("react-native-vision-camera").Camera = jest
      .fn()
      .mockImplementation(() => ({
        takePicture: jest.fn().mockResolvedValue({ uri: "test-uri" }),
        requestCameraPermission: jest.fn().mockResolvedValue("authorized"),
      }));

    // Default mock for rn-mlkit-ocr
    require("rn-mlkit-ocr").recognizeText = jest.fn().mockResolvedValue({
      text: "John Doe\njohn.doe@example.com\n+1-555-123-4567\nAcme Inc.",
    });

    // Default mock for storage
    require("../utils/storage").addContact = jest.fn();
    require("../utils/storage").getContacts = jest.fn().mockReturnValue([]);
    require("../utils/storage").deleteContact = jest.fn();
    require("../utils/storage").updateContact = jest.fn();
    require("../utils/storage").saveSetting = jest.fn();
    require("../utils/storage").getSetting = jest.fn().mockReturnValue(null);
    require("../utils/storage").saveOcrLanguages = jest.fn();
    require("../utils/storage").getOcrLanguages = jest.fn().mockReturnValue([]);

    // Default mock for exportUtils
    require("../utils/exportUtils").exportContactAsVCard = jest
      .fn()
      .mockResolvedValue(true);

    // Default mock for errorHandler
    require("../utils/errorHandler").showErrorAlert = jest.fn();
  });

  it("renders without crashing", () => {
    render(<ScannerScreen />);
    expect(screen.getByText(/Requesting camera permission/i)).toBeTruthy();
  });

  it("handles camera permission granted", async () => {
    render(<ScannerScreen />);
    // Wait for the permission request to complete and the text to disappear
    await waitFor(
      () => {
        const requestingText = screen.queryByText(
          /Requesting camera permission/i
        );
        return !requestingText;
      },
      { timeout: 2000 }
    );
  });

  it("captures image and processes OCR when camera permission granted", async () => {
    render(<ScannerScreen />);

    // Wait for permission to be granted (text disappears)
    await waitFor(
      () => {
        const requestingText = screen.queryByText(
          /Requesting camera permission/i
        );
        return !requestingText;
      },
      { timeout: 2000 }
    );

    // Find the capture button (should be the only button in the camera view)
    // Use findByRole to wait for the button to appear
    const captureButton = await screen.findByRole("button");
    await captureButton.props.onPress();

    // Wait for OCR processing to complete and results to appear
    await waitFor(
      () => {
        return screen.getByText(/John Doe/i);
      },
      { timeout: 2000 }
    );

    // Verify parsed contact info is displayed
    expect(screen.getByText(/John Doe/i)).toBeTruthy();
    expect(screen.getByText(/john.doe@example.com/i)).toBeTruthy();
    expect(screen.getByText(/\+1-555-123-4567/i)).toBeTruthy();
    expect(screen.getByText(/Acme Inc./i)).toBeTruthy();
  });

  it("handles camera permission denied", async () => {
    // Override the mock for react-native-vision-camera to return denied
    require("react-native-vision-camera").Camera = jest
      .fn()
      .mockImplementation(() => ({
        takePicture: jest.fn().mockResolvedValue({ uri: "test-uri" }),
        requestCameraPermission: jest.fn().mockResolvedValue("denied"),
      }));

    render(<ScannerScreen />);

    // Wait for permission denied state
    await waitFor(
      () => {
        return (
          screen.getByText(/Camera permission is required/i) !== null ||
          screen.getByText(/Grant Permission/i) !== null
        );
      },
      { timeout: 2000 }
    );

    // Verify permission button exists
    const permissionButton = screen.getByText(/Grant Permission/i);
    expect(permissionButton).toBeTruthy();
  });

  it("saves contact when save button is pressed", async () => {
    render(<ScannerScreen />);

    // Wait for permission to be granted (text disappears)
    await waitFor(
      () => {
        const requestingText = screen.queryByText(
          /Requesting camera permission/i
        );
        return !requestingText;
      },
      { timeout: 2000 }
    );

    // Find and press capture button
    const captureButton = await screen.findByRole("button");
    await captureButton.props.onPress();

    // Wait for OCR results
    await waitFor(
      () => {
        return screen.getByText(/John Doe/i);
      },
      { timeout: 2000 }
    );

    // Find and press save button
    const saveButton = screen.getByText(/Save Contact/i);
    await saveButton.props.onPress();

    // Verify storage addContact was called
    expect(require("../utils/storage").addContact).toHaveBeenCalled();

    // Verify success by checking we return to initial state (permission requesting text returns)
    await waitFor(
      () => {
        return screen.queryByText(/Requesting camera permission/i) !== null;
      },
      { timeout: 2000 }
    );

    // Verify no error alert was shown for this flow
    expect(showErrorAlert).not.toHaveBeenCalledWith(
      expect.objectContaining({ message: /Failed to save contact/i }),
      expect.anything()
    );
  });

  it("shows error when OCR fails", async () => {
    // Override the mock for rn-mlkit-ocr to throw an error
    require("rn-mlkit-ocr").recognizeText = jest
      .fn()
      .mockRejectedValue(new Error("OCR failed"));

    render(<ScannerScreen />);

    // Wait for permission to be granted
    await waitFor(
      () => {
        const requestingText = screen.queryByText(
          /Requesting camera permission/i
        );
        return !requestingText;
      },
      { timeout: 2000 }
    );

    // Find and press capture button
    const captureButton = await screen.findByRole("button");
    await captureButton.props.onPress();

    // Wait for error handling
    await waitFor(
      () => {
        return showErrorAlert.mock.calls.length > 0;
      },
      { timeout: 2000 }
    );

    // Verify error handler was called
    expect(showErrorAlert).toHaveBeenCalledWith(
      expect.objectContaining({ message: "OCR failed" }),
      "OCR processing"
    );
  });

  it("exports contact as VCard when export button is pressed", async () => {
    render(<ScannerScreen />);

    // Wait for permission to be granted (text disappears)
    await waitFor(
      () => {
        const requestingText = screen.queryByText(
          /Requesting camera permission/i
        );
        return !requestingText;
      },
      { timeout: 2000 }
    );

    // Find and press capture button
    const captureButton = await screen.findByRole("button");
    await captureButton.props.onPress();

    // Wait for OCR results
    await waitFor(
      () => {
        return screen.getByText(/John Doe/i);
      },
      { timeout: 2000 }
    );

    // Find and press export button
    const exportButton = screen.getByText(/Export/i);
    await exportButton.props.onPress();

    // Verify export function was called
    expect(
      require("../utils/exportUtils").exportContactAsVCard
    ).toHaveBeenCalled();

    // Verify success by checking we return to initial state (permission requesting text returns)
    await waitFor(
      () => {
        return screen.queryByText(/Requesting camera permission/i) !== null;
      },
      { timeout: 2000 }
    );

    // Verify no error alert was shown for export failure
    expect(showErrorAlert).not.toHaveBeenCalledWith(
      expect.objectContaining({ message: /Failed to export contact/i }),
      expect.anything()
    );
  });

  it("retakes photo when retake button is pressed", async () => {
    render(<ScannerScreen />);

    // Wait for permission to be granted (text disappears)
    await waitFor(
      () => {
        const requestingText = screen.queryByText(
          /Requesting camera permission/i
        );
        return !requestingText;
      },
      { timeout: 2000 }
    );

    // Find and press capture button
    const captureButton = await screen.findByRole("button");
    await captureButton.props.onPress();

    // Wait for OCR results
    await waitFor(
      () => {
        return screen.getByText(/John Doe/i);
      },
      { timeout: 2000 }
    );

    // Find and press retake button
    const retakeButton = screen.getByText(/Retake/i);
    await retakeButton.props.onPress();

    // Verify results view is hidden
    await waitFor(
      () => {
        return screen.queryByText(/Extracted Information/i) === null;
      },
      { timeout: 2000 }
    );

    // Verify camera view is shown again (permission requesting text returns)
    await waitFor(
      () => {
        return screen.queryByText(/Requesting camera permission/i) !== null;
      },
      { timeout: 2000 }
    );
  });
});
