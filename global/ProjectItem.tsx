
export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: string;
  tasks: {
    title: string;
    description: string;
    dueDate: string;
    status: string;
    assignedTo: string;
  }[];
  type: 'Projects';
  imageLink: string;
  members: string[];
}
