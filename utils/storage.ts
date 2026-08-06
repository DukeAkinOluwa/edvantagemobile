import AsyncStorage from "@react-native-async-storage/async-storage";

export const saveData = async (key: string, value: any): Promise<void> => {
  try {
    const serializedValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, serializedValue);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : `Failed to save ${key}`;
    throw new Error(`Storage error: ${errorMessage}`);
  }
};

export const getData = async (key: string): Promise<any> => {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value === null) return null;
    try {
      return JSON.parse(value);
    } catch (parseError) {
      throw new Error(`Failed to parse stored data for ${key}`);
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : `Failed to retrieve ${key}`;
    throw new Error(`Storage error: ${errorMessage}`);
  }
};

export const removeData = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : `Failed to remove ${key}`;
    throw new Error(`Storage error: ${errorMessage}`);
  }
};
