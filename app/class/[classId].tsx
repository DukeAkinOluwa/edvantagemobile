import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList, Dimensions, Clipboard, Alert, ScrollView, Modal, TextInput } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { NavigationHeader, useTheme } from "@/components/Header";
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from "@/components/ThemedText";
import { FontAwesome6 } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, orderBy, addDoc } from "firebase/firestore";
import { Picker } from "@react-native-picker/picker";
import { ScheduleEvent } from "@/lib/scheduleService";

const { width } = Dimensions.get("window");

export default function ClassDetailsScreen() {
  const { classId } = useLocalSearchParams<{ classId: string }>();
  const { theme } = useTheme();
  const router = useRouter();
  const { profile, user } = useAuth();
  
  const [classData, setClassData] = useState<ScheduleEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "announcements" | "assignments" | "resources">("overview");

  const [assignments, setAssignments] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [myAttendance, setMyAttendance] = useState<{present: number, total: number}>({present: 0, total: 0});
  const [lastMeeting, setLastMeeting] = useState<any>(null);
  const [nextMeeting, setNextMeeting] = useState<any>(null);
  const [pastMeetings, setPastMeetings] = useState<any[]>([]);
  const [allAttendance, setAllAttendance] = useState<any[]>([]);
  
  const isLecturer = profile?.role === "lecturer";

  // Announcement Modal State
  const [announcementModalVisible, setAnnouncementModalVisible] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementMsg, setAnnouncementMsg] = useState("");
  const [isPostingAnn, setIsPostingAnn] = useState(false);

  // Resource Modal State
  const [resourceModalVisible, setResourceModalVisible] = useState(false);
  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceSummary, setResourceSummary] = useState("");
  const [resourceType, setResourceType] = useState("Document");
  const [isUploadingRes, setIsUploadingRes] = useState(false);

  useEffect(() => {
    if (!classId) return;
    const fetchData = async () => {
      try {
        const docRef = doc(db, "schedules", classId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setClassData({ id: snap.id, ...snap.data() } as ScheduleEvent);
        }

        // Fetch Assignments
        const assignQ = query(collection(db, "tasks"), where("classId", "==", classId), where("type", "==", "assignment"));
        const assignSnap = await getDocs(assignQ);
        setAssignments(assignSnap.docs.map(d => ({id: d.id, ...d.data()})));

        // Fetch Resources
        const resQ = query(collection(db, "resources"), where("classId", "==", classId));
        const resSnap = await getDocs(resQ);
        setResources(resSnap.docs.map(d => ({id: d.id, ...d.data()})));

        // Fetch Announcements
        const annQ = query(collection(db, "broadcasts"), where("classId", "==", classId));
        const annSnap = await getDocs(annQ);
        setAnnouncements(annSnap.docs.map(d => ({id: d.id, ...d.data()})));

        // Fetch Attendance
        let cCode = classId;
        if (snap.exists()) {
          cCode = snap.data().courseCode;
        }

        const attQ = query(collection(db, "attendance"), where("courseCode", "==", cCode));
        const attSnap = await getDocs(attQ);
        const attData = attSnap.docs.map(d => d.data());
        setAllAttendance(attData);

        let present = 0;
        let total = 0;
        if (user) {
          attData.forEach(d => {
            total++;
            if (d.records?.[user.uid] === "present") present++;
          });
        }
        setMyAttendance({ present, total });

        // Find next and last classes
        if (snap.exists()) {
          const allSchedQ = query(collection(db, "schedules"), where("courseCode", "==", cCode));
          const allSchedSnap = await getDocs(allSchedQ);
          const meetings = allSchedSnap.docs.map(d => d.data());
          const now = Date.now();
          
          let lastM = null;
          let nextM = null;
          let past: any[] = [];

          meetings.forEach(m => {
            if (m.startTime < now) {
              if (!lastM || m.startTime > lastM.startTime) lastM = m;
              past.push(m);
            } else {
              if (!nextM || m.startTime < nextM.startTime) nextM = m;
            }
          });

          // sort past descending
          past.sort((a, b) => b.startTime - a.startTime);
          setPastMeetings(past);
          setLastMeeting(lastM);
          setNextMeeting(nextM);
        }

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [classId, user]);

  if (loading) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: theme.background, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#2A52BE" />
      </ThemedView>
    );
  }

  if (!classData) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: theme.background, justifyContent: "center", alignItems: "center" }]}>
        <ThemedText style={{ color: theme.text }}>Class not found.</ThemedText>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  const copyClassCode = () => {
    if (classData.classCode) {
      Clipboard.setString(classData.classCode);
      Alert.alert("Copied!", "Class code copied to clipboard.");
    }
  };

  const handlePostAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementMsg.trim()) {
      Alert.alert("Error", "Please fill out all fields.");
      return;
    }
    setIsPostingAnn(true);
    try {
      await addDoc(collection(db, "broadcasts"), {
        title: announcementTitle.trim(),
        message: announcementMsg.trim(),
        classId: classId,
        authorId: user?.uid,
        authorName: profile?.displayName || `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim(),
        createdAt: new Date().toISOString(),
      });
      setAnnouncementModalVisible(false);
      setAnnouncementTitle("");
      setAnnouncementMsg("");
      Alert.alert("Success", "Announcement posted!");
      // Refetch announcements
      const annQ = query(collection(db, "broadcasts"), where("classId", "==", classId));
      const annSnap = await getDocs(annQ);
      setAnnouncements(annSnap.docs.map(d => ({id: d.id, ...d.data()})));
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to post announcement.");
    } finally {
      setIsPostingAnn(false);
    }
  };

  const handleUploadResource = async () => {
    if (!resourceTitle.trim()) {
      Alert.alert("Error", "Please provide a title.");
      return;
    }
    setIsUploadingRes(true);
    try {
      const ext = resourceType === "Video" ? ".mp4" : resourceType === "Audio" ? ".mp3" : resourceType === "Image" ? ".jpg" : ".pdf";
      const mockPath = `/mock/resources/${resourceTitle.trim().toLowerCase().replace(/\s+/g, "_")}${ext}`;
      
      await addDoc(collection(db, "resources"), {
        title: resourceTitle.trim(),
        filename: resourceTitle.trim(),
        filepath: mockPath,
        classId: classId,
        uploadedBy: profile?.displayName || `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim(),
        summary: resourceSummary.trim() || "No description provided.",
        createdAt: new Date().toISOString(),
      });
      setResourceModalVisible(false);
      setResourceTitle("");
      setResourceSummary("");
      Alert.alert("Success", "Resource uploaded!");
      // Refetch resources
      const resQ = query(collection(db, "resources"), where("classId", "==", classId));
      const resSnap = await getDocs(resQ);
      setResources(resSnap.docs.map(d => ({id: d.id, ...d.data()})));
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to upload resource.");
    } finally {
      setIsUploadingRes(false);
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <NavigationHeader title={classData.courseCode} />
      
      {/* Class Banner */}
      <View style={styles.banner}>
        <ThemedText style={styles.bannerTitle}>{classData.title}</ThemedText>
        <ThemedText style={styles.bannerSub}>{classData.lecturerName}</ThemedText>
        
        {isLecturer && classData.classCode && (
          <TouchableOpacity style={styles.codeBadge} onPress={copyClassCode}>
            <Text style={styles.codeText}>Code: {classData.classCode}</Text>
            <FontAwesome6 name="copy" size={12} color="#fff" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        )}
        {classData.chatId && (
          <TouchableOpacity 
            style={{ marginTop: 15, paddingVertical: 8, paddingHorizontal: 15, flexDirection: "row", backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 8, alignItems: "center" }}
            onPress={() => {
              router.push(`/chat/${classData.chatId}?name=${encodeURIComponent(classData.courseCode + " Chat")}&isGroup=true&isClassGroup=true&classId=${classId}`);
            }}
          >
            <FontAwesome6 name="comments" size={14} color="#fff" style={{ marginRight: 8 }} />
            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 14 }}>Join Class Chat</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={{ flexGrow: 0 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ borderBottomWidth: 1, borderBottomColor: theme.border }} contentContainerStyle={{ paddingHorizontal: 10 }}>
        {(["overview", "announcements", "assignments", "resources", "attendance"] as const).map((tab) => (
          <TouchableOpacity 
            key={tab} 
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive, { borderBottomColor: activeTab === tab ? "#2A52BE" : "transparent" }]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? "#2A52BE" : theme.placeholder }]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
        </ScrollView>
      </View>

      {/* Tab Content */}
      <ScrollView style={styles.content}>
        {activeTab === "overview" && (
          <View style={styles.overviewContainer}>
            <ThemedText style={styles.sectionTitle}>Class Schedule</ThemedText>
            
            {/* Next Meeting */}
            {nextMeeting ? (
              <View style={[styles.infoCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                <View style={styles.meetingIconBox}><FontAwesome6 name="calendar-check" size={16} color="#4CAF50" /></View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.meetingLabel}>Next Meeting</ThemedText>
                  <ThemedText style={[styles.infoText, { color: theme.text }]}>
                    {new Date(nextMeeting.startTime).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </ThemedText>
                  <ThemedText style={[styles.meetingLoc, { color: theme.placeholder }]}>📍 {nextMeeting.location}</ThemedText>
                </View>
              </View>
            ) : (
              <View style={[styles.infoCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                <ThemedText style={[styles.infoText, { color: theme.placeholder }]}>No upcoming meetings scheduled.</ThemedText>
              </View>
            )}

            {/* Last Meeting */}
            {lastMeeting ? (
              <View style={[styles.infoCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                <View style={[styles.meetingIconBox, { backgroundColor: 'rgba(158,158,158,0.2)' }]}><FontAwesome6 name="clock-rotate-left" size={16} color="#9E9E9E" /></View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.meetingLabel}>Last Meeting</ThemedText>
                  <ThemedText style={[styles.infoText, { color: theme.text }]}>
                    {new Date(lastMeeting.startTime).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </ThemedText>
                  <ThemedText style={[styles.meetingLoc, { color: theme.placeholder }]}>📍 {lastMeeting.location}</ThemedText>
                </View>
              </View>
            ) : (
              <View style={[styles.infoCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                <ThemedText style={[styles.infoText, { color: theme.placeholder }]}>No previous meetings recorded.</ThemedText>
              </View>
            )}

            <View style={{ height: 10 }} />
            <ThemedText style={styles.sectionTitle}>Statistics</ThemedText>

            {isLecturer ? (
              <View style={[styles.statsCard, { backgroundColor: "rgba(42, 82, 190, 0.1)" }]}>
                <ThemedText style={styles.statsLabel}>Enrolled Students</ThemedText>
                <ThemedText style={styles.statsValue}>{classData.participants?.length || 0}</ThemedText>
              </View>
            ) : (
              <View style={[styles.statsCard, { backgroundColor: "rgba(76, 175, 80, 0.1)" }]}>
                <ThemedText style={[styles.statsLabel, { color: "#4CAF50" }]}>My Attendance</ThemedText>
                <ThemedText style={[styles.statsValue, { color: "#4CAF50", fontSize: 18 }]}>
                  {myAttendance.total > 0 ? `${myAttendance.present} / ${myAttendance.total} Meetings Attended` : "No records yet"}
                </ThemedText>
              </View>
            )}
          </View>
        )}

        {activeTab === "announcements" && (
          <View style={styles.tabSection}>
            {announcements.length === 0 ? (
              <View style={styles.emptyContainer}>
                <FontAwesome6 name="bullhorn" size={40} color={theme.placeholder} />
                <ThemedText style={[styles.emptyText, { color: theme.placeholder }]}>No announcements posted yet.</ThemedText>
              </View>
            ) : (
              announcements.map(ann => (
                <View key={ann.id} style={[styles.itemCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                  <ThemedText style={styles.itemTitle}>{ann.title}</ThemedText>
                  <ThemedText style={[styles.itemDesc, { color: theme.placeholder }]}>{ann.message}</ThemedText>
                  <ThemedText style={styles.itemMeta}>By {ann.authorName} • {new Date(ann.createdAt).toLocaleDateString()}</ThemedText>
                </View>
              ))
            )}
            {isLecturer && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => setAnnouncementModalVisible(true)}>
                <Text style={styles.actionBtnText}>Post Announcement</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {activeTab === "assignments" && (
          <View style={styles.tabSection}>
            {assignments.length === 0 ? (
              <View style={styles.emptyContainer}>
                <FontAwesome6 name="clipboard-list" size={40} color={theme.placeholder} />
                <ThemedText style={[styles.emptyText, { color: theme.placeholder }]}>No assignments posted yet.</ThemedText>
              </View>
            ) : (
              assignments.map(ass => (
                <View key={ass.id} style={[styles.itemCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                  <ThemedText style={styles.itemTitle}>{ass.title}</ThemedText>
                  <ThemedText style={[styles.itemDesc, { color: theme.placeholder }]}>{ass.description}</ThemedText>
                  <ThemedText style={styles.itemMeta}>Due: {new Date(ass.dueDate).toLocaleString()}</ThemedText>
                </View>
              ))
            )}
            {isLecturer && (
              <TouchableOpacity style={styles.actionBtn}>
                <Text style={styles.actionBtnText}>Create Assignment</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {activeTab === "resources" && (
          <View style={styles.tabSection}>
            {resources.length === 0 ? (
              <View style={styles.emptyContainer}>
                <FontAwesome6 name="folder-open" size={40} color={theme.placeholder} />
                <ThemedText style={[styles.emptyText, { color: theme.placeholder }]}>No resources uploaded yet.</ThemedText>
              </View>
            ) : (
              resources.map(res => (
                <View key={res.id} style={[styles.itemCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                  <ThemedText style={styles.itemTitle}>{res.title}</ThemedText>
                  <ThemedText style={styles.itemMeta}>Uploaded by {res.uploadedBy} • {new Date(res.createdAt).toLocaleDateString()}</ThemedText>
                </View>
              ))
            )}
            {isLecturer && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => setResourceModalVisible(true)}>
                <Text style={styles.actionBtnText}>Upload Resource</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {activeTab === "attendance" && (
          <View style={styles.tabSection}>
            <View style={[styles.statsCard, { backgroundColor: "rgba(76, 175, 80, 0.1)", marginBottom: 20 }]}>
              <ThemedText style={[styles.statsLabel, { color: "#4CAF50" }]}>Total Attendance</ThemedText>
              <ThemedText style={[styles.statsValue, { color: "#4CAF50", fontSize: 24 }]}>
                {myAttendance.total > 0 ? `${myAttendance.present} / ${myAttendance.total} Meetings` : "No records yet"}
              </ThemedText>
            </View>
            
            <ThemedText style={styles.sectionTitle}>Past Classes</ThemedText>
            {pastMeetings.length === 0 ? (
              <View style={styles.emptyContainer}>
                <FontAwesome6 name="calendar-xmark" size={40} color={theme.placeholder} />
                <ThemedText style={[styles.emptyText, { color: theme.placeholder }]}>No past meetings found.</ThemedText>
              </View>
            ) : (
              pastMeetings.map(meeting => {
                // Find attendance record for this meeting
                const record = allAttendance.find(a => a.classId === meeting.id);
                let myStatus = "unknown";
                if (record && user) {
                  myStatus = record.records?.[user.uid] || "absent";
                }

                return (
                  <View key={meeting.id} style={[styles.itemCard, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, flexDirection: "row", alignItems: "center" }]}>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={styles.itemTitle}>{new Date(meeting.startTime).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</ThemedText>
                      <ThemedText style={styles.itemMeta}>📍 {meeting.location}</ThemedText>
                    </View>
                    <View style={styles.attendanceBadge}>
                      {myStatus === "present" ? (
                        <>
                          <FontAwesome6 name="check-circle" size={16} color="#4CAF50" />
                          <Text style={{ color: "#4CAF50", fontWeight: "bold", marginLeft: 6 }}>Checked In</Text>
                        </>
                      ) : myStatus === "absent" ? (
                        <>
                          <FontAwesome6 name="xmark-circle" size={16} color="#F44336" />
                          <Text style={{ color: "#F44336", fontWeight: "bold", marginLeft: 6 }}>Absent</Text>
                        </>
                      ) : (
                        <Text style={{ color: theme.placeholder }}>No Record</Text>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* Announcement Modal */}
      <Modal visible={announcementModalVisible} transparent animationType="slide" onRequestClose={() => setAnnouncementModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundSecondary }]}>
            <ThemedText style={[styles.modalTitle, { color: theme.text }]}>Post Announcement</ThemedText>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              placeholder="Title"
              placeholderTextColor={theme.placeholder}
              value={announcementTitle}
              onChangeText={setAnnouncementTitle}
            />
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border, minHeight: 80, textAlignVertical: "top" }]}
              placeholder="Message"
              placeholderTextColor={theme.placeholder}
              multiline
              numberOfLines={3}
              value={announcementMsg}
              onChangeText={setAnnouncementMsg}
            />
            <View style={styles.btnRow}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.border }]} onPress={() => setAnnouncementModalVisible(false)}>
                <Text style={[styles.btnText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.primary }, isPostingAnn && { opacity: 0.6 }]} onPress={handlePostAnnouncement} disabled={isPostingAnn}>
                <Text style={[styles.btnText, { color: theme.secondary }]}>{isPostingAnn ? "Posting..." : "Post"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Resource Modal */}
      <Modal visible={resourceModalVisible} transparent animationType="slide" onRequestClose={() => setResourceModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: theme.backgroundSecondary }]}>
            <ThemedText style={[styles.modalTitle, { color: theme.text }]}>Upload Coursework</ThemedText>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              placeholder="Resource Title (e.g. Intro to UI Design)"
              placeholderTextColor={theme.placeholder}
              value={resourceTitle}
              onChangeText={setResourceTitle}
            />
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border, minHeight: 80, textAlignVertical: "top" }]}
              placeholder="Summary/Description"
              placeholderTextColor={theme.placeholder}
              multiline
              numberOfLines={3}
              value={resourceSummary}
              onChangeText={setResourceSummary}
            />
            <ThemedText style={{ fontSize: 14, fontWeight: "600", marginBottom: 5, color: theme.text }}>Resource Type</ThemedText>
            <View style={{ borderWidth: 1, borderColor: theme.border, borderRadius: 8, marginBottom: 15, overflow: "hidden" }}>
              <Picker
                selectedValue={resourceType}
                onValueChange={(val) => setResourceType(val)}
                style={{ color: theme.text, backgroundColor: theme.background }}
                dropdownIconColor={theme.text}
              >
                <Picker.Item label="Document (PDF, Doc)" value="Document" />
                <Picker.Item label="Video Lecture" value="Video" />
                <Picker.Item label="Audio Lecture" value="Audio" />
                <Picker.Item label="Image Asset" value="Image" />
                <Picker.Item label="Other File" value="Other" />
              </Picker>
            </View>
            <View style={styles.btnRow}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.border }]} onPress={() => setResourceModalVisible(false)}>
                <Text style={[styles.btnText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.primary }, isUploadingRes && { opacity: 0.6 }]} onPress={handleUploadResource} disabled={isUploadingRes}>
                <Text style={[styles.btnText, { color: theme.secondary }]}>{isUploadingRes ? "Uploading..." : "Publish"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backBtn: { marginTop: 15, padding: 10, backgroundColor: "#2A52BE", borderRadius: 8 },
  backBtnText: { color: "#fff", fontWeight: "600" },
  banner: { padding: 20, backgroundColor: "#2A52BE", alignItems: "center" },
  bannerTitle: { fontSize: 24, fontWeight: "bold", color: "#fff", marginBottom: 5, textAlign: "center" },
  bannerSub: { fontSize: 16, color: "rgba(255,255,255,0.8)" },
  codeBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(0,0,0,0.2)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginTop: 15 },
  codeText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  tabBar: { flexDirection: "row", borderBottomWidth: 1 },
  tabBtn: { flex: 1, paddingVertical: 15, alignItems: "center", borderBottomWidth: 2, paddingHorizontal: 20 },
  tabBtnActive: {},
  tabText: { fontSize: 15, fontWeight: "600" },
  content: { flex: 1 },
  tabSection: { padding: 20 },
  overviewContainer: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 15 },
  infoCard: { flexDirection: "row", alignItems: "center", padding: 15, borderWidth: 1, borderRadius: 12, marginBottom: 12, gap: 12 },
  infoText: { fontSize: 16, fontWeight: "500", flex: 1 },
  meetingIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(76,175,80,0.1)', alignItems: 'center', justifyContent: 'center' },
  meetingLabel: { fontSize: 12, color: "#888", marginBottom: 2, textTransform: "uppercase", fontWeight: "600" },
  meetingLoc: { fontSize: 13, marginTop: 4 },
  statsCard: { padding: 20, borderRadius: 12, marginTop: 10, alignItems: "center" },
  statsLabel: { fontSize: 14, color: "#2A52BE", fontWeight: "600", marginBottom: 5 },
  statsValue: { fontSize: 24, color: "#2A52BE", fontWeight: "bold" },
  emptyContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 40 },
  emptyText: { marginTop: 15, fontSize: 16 },
  actionBtn: { backgroundColor: "#2A52BE", padding: 15, borderRadius: 12, alignItems: "center", marginTop: 20 },
  actionBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  itemCard: { padding: 15, borderWidth: 1, borderRadius: 12, marginBottom: 12 },
  itemTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 5 },
  itemDesc: { fontSize: 14, marginBottom: 8 },
  itemMeta: { fontSize: 12, color: "#888" },
  attendanceBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(0,0,0,0.05)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  modalContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
  modalContent: { width: "90%", borderRadius: 12, padding: 20, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 15, textAlign: "center" },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 15, marginBottom: 12 },
  btnRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10, gap: 10 },
  modalBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: "center" },
  btnText: { fontWeight: "bold", fontSize: 16 }
});
