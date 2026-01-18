import xml.etree.ElementTree as ET
import sys

FILE_PATH = "finaderdiagram.drawio"
OUTPUT_PATH = "finaderdiagram.drawio"

def update_geometry(root, id_map):
    for cell in root.iter("mxCell"):
        cell_id = cell.get("id")
        if cell_id in id_map:
            geo = cell.find("mxGeometry")
            if geo is not None:
                new_x, new_y = id_map[cell_id]
                geo.set("x", str(new_x))
                geo.set("y", str(new_y))
                # Reset width/height if needed, but keeping existing is safer usually.
                # However, to be neat, let's allow them to keep their size.
        
        # Identify edges and clear their waypoints to force auto-routing
        # Edges typically have source, target, and edge="1"
        if cell.get("edge") == "1":
            geo = cell.find("mxGeometry")
            if geo is not None:
                # Remove array of points (waypoints)
                array = geo.find("Array")
                if array is not None:
                    geo.remove(array)
            
            # Reset edge style to orthogonal for neatness
            style = cell.get("style", "")
            if "edgeStyle" not in style or "orthogonalEdgeStyle" not in style:
                # Try to enforce orthogonal layout
                # simple regex replacement or append might be tricky, let's just prepend
                if "edgeStyle=" in style:
                    # simplistic replace
                    pass 
                else:
                    cell.set("style", "edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;" + style)

# ID Mapping for Layout
# Tables
ADMIN_ID = "EoEyUaqDCjdvldWjgz71-1"
THANA_ID = "EoEyUaqDCjdvldWjgz71-15"
RANKS_ID = "EoEyUaqDCjdvldWjgz71-42"
OFFICERS_ID = "EoEyUaqDCjdvldWjgz71-119"
USER_ID = "EoEyUaqDCjdvldWjgz71-141"
GD_ID = "EoEyUaqDCjdvldWjgz71-240"
CRIMINAL_ID = "EoEyUaqDCjdvldWjgz71-103"
CASES_ID = "EoEyUaqDCjdvldWjgz71-208"
ORG_ID = "EoEyUaqDCjdvldWjgz71-172"
RELATIONS_ID = "EoEyUaqDCjdvldWjgz71-188"
LOCATION_ID = "EoEyUaqDCjdvldWjgz71-195"
ARREST_ID = "EoEyUaqDCjdvldWjgz71-227"
BAIL_ID = "EoEyUaqDCjdvldWjgz71-253"
INCARCERATION_ID = "EoEyUaqDCjdvldWjgz71-272"
JAILS_ID = "EoEyUaqDCjdvldWjgz71-52"
BLOCKS_ID = "EoEyUaqDCjdvldWjgz71-71"
CELLS_ID = "EoEyUaqDCjdvldWjgz71-84"

# Diamonds (Relationships)
REG_THANA_DIA = "EoEyUaqDCjdvldWjgz71-14"
EMPLOYS_DIA = "EoEyUaqDCjdvldWjgz71-163" 
HEADED_DIA = "EoEyUaqDCjdvldWjgz71-166"
ASSIGNED_DIA = "EoEyUaqDCjdvldWjgz71-169" # Rank -> Officer
HAS_BLOCKS_DIA = "EoEyUaqDCjdvldWjgz71-81"
HAS_CELL_DIA = "EoEyUaqDCjdvldWjgz71-100"
HAS_INCAR_DIA = "EoEyUaqDCjdvldWjgz71-282" # Arrest -> Incarceration
HAS_BAIL_DIA = "EoEyUaqDCjdvldWjgz71-285" # Arrest -> Bail

# Coordinates (X, Y)
# Layout Strategy:
# Column 1 (x=40): Admin -> Thana -> Officers -> Ranks
# Column 2 (x=400): Public (User, GD) -> Criminals (Cases, Profiles, Relations)
# Column 3 (x=760): Events (Arrests, Bail, Incarceration)
# Column 4 (x=1120): Jail Infrastructure (Jails, Blocks, Cells)

layout_map = {
    # COL 1: Admin/Police
    ADMIN_ID: (40, 40),
    REG_THANA_DIA: (80, 240), # Between Admin(height~150) and Thana
    
    THANA_ID: (40, 360),
    EMPLOYS_DIA: (80, 680), # Below Thana
    
    OFFICERS_ID: (40, 800),
    ASSIGNED_DIA: (260, 880), # Side of Officer? Or below? Let's put Rank below Officer
    
    RANKS_ID: (40, 1100), # Below Officers

    # COL 2: Users & Criminals
    USER_ID: (400, 40),
    GD_ID: (400, 360), # Below User

    CASES_ID: (400, 700), # Criminal Cases
    CRIMINAL_ID: (400, 960), # Core Criminal Profile
    
    ORG_ID: (280, 1200), # Left of Criminal Relations?
    RELATIONS_ID: (520, 1200), # Right of Org
    LOCATION_ID: (400, 1340), # Below Relations

    # COL 3: Arrests/Legal
    ARREST_ID: (800, 960), # Right of Criminal (Aligned)
    
    HAS_BAIL_DIA: (840, 1160),
    BAIL_ID: (800, 1240),
    
    HAS_INCAR_DIA: (940, 1160), # Shifted right slightly
    INCARCERATION_ID: (1000, 1240), # Next to Bail

    # COL 4: Jail System
    JAILS_ID: (1360, 40),
    HAS_BLOCKS_DIA: (1400, 300),
    
    BLOCKS_ID: (1360, 420),
    
    HAS_CELL_DIA: (1400, 600),
    CELLS_ID: (1360, 720) # Allows Incarceration to link up/diagonal to Cells
}

try:
    tree = ET.parse(FILE_PATH)
    root = tree.getroot()
    update_geometry(root, layout_map)
    tree.write(OUTPUT_PATH)
    print("Successfully updated Drawio layout.")
except Exception as e:
    print(f"Error: {e}")
