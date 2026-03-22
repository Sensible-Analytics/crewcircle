import { handleError, showErrorAlert } from "../src/utils/errorHandler";

// Mock Alert from react-native
jest.mock("react-native", () => ({
  Alert: {
    alert: jest.fn(),
  },
}));

describe("errorHandler", () => {
  let alertMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console.error to prevent output during tests
    jest.spyOn(console, "error").mockImplementation(() => {});
    // Get the mock alert function
    alertMock = require("react-native").Alert.alert as jest.Mock;
    alertMock.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("handleError", () => {
    it("should return formatted error with code when error.code exists", () => {
      const error = { code: "ERR_NOT_FOUND", message: "Resource not found" };
      const result = handleError(error, "testContext");
      expect(result).toBe("Error ERR_NOT_FOUND: Resource not found");
    });

    it("should return error message when error.message exists but no code", () => {
      const error = { message: "Something went wrong" };
      const result = handleError(error, "testContext");
      expect(result).toBe("Something went wrong");
    });

    it("should return generic error message when neither code nor message exists", () => {
      const error = {};
      const result = handleError(error, "testContext");
      expect(result).toBe("An unexpected error occurred");
    });

    it("should handle Error object instances", () => {
      const error = new Error("Test error message");
      const result = handleError(error, "testContext");
      expect(result).toBe("Test error message");
    });

    it("should include context in console.error output", () => {
      const error = { message: "Test error" };
      handleError(error, "testContext");
      expect(console.error).toHaveBeenCalledWith(
        "Error in testContext:",
        error
      );
    });
  });

  describe("showErrorAlert", () => {
    it("should call Alert.alert with formatted message", () => {
      const error = { code: "ERR_TEST", message: "Test error" };
      showErrorAlert(error, "testContext");

      expect(alertMock).toHaveBeenCalledWith(
        "Error",
        "Error ERR_TEST: Test error"
      );
    });

    it("should call Alert.alert with error message when no code", () => {
      const error = { message: "Test error message" };
      showErrorAlert(error, "testContext");

      expect(alertMock).toHaveBeenCalledWith("Error", "Test error message");
    });

    it("should call Alert.alert with generic message when no error details", () => {
      const error = {};
      showErrorAlert(error, "testContext");

      expect(alertMock).toHaveBeenCalledWith(
        "Error",
        "An unexpected error occurred"
      );
    });
  });
});
