import { getData, saveData } from "@/utils/storage";
import * as FileSystem from "expo-file-system";

interface UserData {
  firstName?: string;
  lastName?: string;
  bio?: string;
  dob?: string;
  gender?: string;
  profilePic?: string;
  course?: string;
  level?: string;
  themeMode?: "system" | "light" | "dark";
  allowNotifications?: boolean;
  allowAlarms?: boolean;
}

class UserDataInfo {
  private data: UserData = {};
  private initialized: boolean = false;

  async initialize() {
    if (this.initialized) return;
    console.log("UserDataInfo: Initializing");
    const savedData = await getData("userData");
    if (savedData) {
      this.data = savedData;
      console.log("UserDataInfo: Loaded data:", this.data);
    }
    this.initialized = true;
  }

  getData(): UserData {
    return { ...this.data };
  }

  async setData(
    newData: Partial<UserData>,
    options: { isImage?: boolean } = {}
  ) {
    const updatedData = { ...this.data, ...newData };
    this.data = updatedData;
    console.log("UserDataInfo: Saving data:", updatedData);

    try {
      await saveData("userData", updatedData);
      if (options.isImage && newData.profilePic) {
        const fileName = `profile_${Date.now()}.jpg`;
        const newPath = `${FileSystem.documentDirectory}${fileName}`;
        await FileSystem.copyAsync({ from: newData.profilePic, to: newPath });
        this.data.profilePic = newPath;
        console.log("UserDataInfo: Persistent image URI:", newPath);
        await saveData("userData", this.data);
      }
    } catch (error) {
      console.error("UserDataInfo: Save error:", error);
      throw error;
    }
  }

  async clearData() {
    this.data = {};
    await saveData("userData", {});
    console.log("UserDataInfo: Cleared data");
  }
}

const userDataInfo = new UserDataInfo();
export default userDataInfo;
