import json
import uvicorn
from fastapi import FastAPI, Request, Form, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI()

# Add CORS middleware to allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Database Utility ---
def load_db(name: str):
    with open(f'backend/database/{name}.json', 'r', encoding='utf-8') as f:
        return json.load(f)

# --- Data Transformation Utilities ---
def transform_booking(booking, index):
    return {
        "rowNumber": index + 2, # Mimic sheet row number
        "Guest Name": booking.get("guest_name"),
        "Room Number": booking.get("room_id"), # Assuming room_id is the number
        "Room Type": booking.get("room_type"),
        "Check-in Date": booking.get("start_date"),
        "Check-out Date": booking.get("end_date"),
        "Total Price": booking.get("total_price", 0),
        "Cash Amount": booking.get("cash_amount", 0),
        "Transfer Amount": booking.get("transfer_amount", 0),
        "Status": booking.get("status", "Checked In"),
        "Files": booking.get("files", "")
    }

def transform_room(room):
    # The frontend expects 'number' for the value, not 'id'
    return {
        "number": room.get("id"),
        "type": room.get("type"),
        "price": room.get("price"),
        "status": room.get("status")
    }

def transform_expense(expense, index):
    return {
        "rowNumber": index + 2,
        "Date": expense.get("date"),
        "Description": expense.get("description"),
        "Amount": expense.get("amount"),
        "Category": expense.get("category", "")
    }

# --- API Endpoints ---

@app.get("/api")
async def handle_get_request(action: str):
    print(f"Received GET request for action: {action}")
    
    if action == 'ping':
        return JSONResponse(content={"status": "success", "data": "pong"})
    
    if action == 'getRooms':
        rooms_db = load_db('rooms')
        transformed_rooms = [transform_room(r) for r in rooms_db]
        return JSONResponse(content=transformed_rooms)

    if action == 'getActivities':
        bookings_db = load_db('bookings')
        transformed_bookings = [transform_booking(b, i) for i, b in enumerate(bookings_db)]
        return JSONResponse(content=transformed_bookings)

    if action == 'getExpenses':
        expenses_db = load_db('expenses')
        transformed_expenses = [transform_expense(e, i) for i, e in enumerate(expenses_db)]
        return JSONResponse(content=transformed_expenses)

    raise HTTPException(status_code=404, detail=f"Action '{action}' not found.")

@app.post("/api")
async def handle_post_request(action: str = Form(...)):
    print(f"Received POST request for action: {action}")
    # This is where ADD_BOOKING, ADD_EXPENSE etc. would be implemented
    return JSONResponse(content={"status": "success", "message": f"POST action '{action}' received."})

# --- Static File Serving ---

app.mount("/assets", StaticFiles(directory="assets"), name="assets")
app.mount("/pwa", StaticFiles(directory="pwa"), name="pwa")

@app.get("/{full_path:path}")
async def serve_frontend(request: Request, full_path: str):
    path = full_path
    if path == "" or not os.path.exists(path):
        path = "index.html"
    return FileResponse(path)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=3000)
