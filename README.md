# 🎨 Real-Time Collaborative Whiteboard

A full-featured **real-time collaborative whiteboard** application that enables multiple users to draw, write, and interact on a shared canvas from anywhere. Designed for smooth collaboration, the app supports drawing tools, shape creation, text input, and real-time synchronization using WebSockets.

---

## 📘 i. Project Description

This project allows multiple users to collaborate on a whiteboard in real-time. It supports drawing tools like pen, eraser, shapes, and text, along with color and brush size options. Users can join a room using a link, and rooms can be configured to be editable or view-only. Data is synchronized using Socket.IO.

---

## ✅ ii. Features

- 🖍️ Pen Tool with adjustable color and thickness  
- ⭕ Shape Tool: Draw rectangles and circles  
- 🅰️ Text Tool  
- 🧽 Eraser Tool  
- 🎨 Color Picker & Brush Size Slider  
- ↩️ Undo / Redo  
- 🧹 Clear Canvas  
- 💾 Save Canvas as Image (PNG)  
- 🌐 Real-time sync via Socket.IO  
- 🔗 Room-based collaboration via unique URL  
- 🔒 Editable and View-only mode support  
- 🔑 Optional room password protection  


## 🛠️ iii. Tech Stack Used

### Frontend:
- **React.js**
- **Fabric.js**
- **Socket.IO Client**

### Backend:
- **Node.js**
- **Express.js**
- **Socket.IO Server**




## 🧪 iii. Setup Instructions to Run the Project Locally

1.Clone the repository

```bash
git clone https://github.com/yKapilupa008/whiteboard.git
cd whiteboard

2. Setup Backend
bash
Copy
Edit
cd backend
npm install

Create a .env file:

env
Copy
Edit
MONGO_URI=your_mongodb_connection_string


3. Setup Frontend
bash
Copy
Edit
cd ../frontend
npm install

npm start


__###  iv.Demo video link__

https://drive.google.com/file/d/1Aei7DvO_nylw9qFNHRkAGzaI1wJOiNzV/view?usp=sharing 
