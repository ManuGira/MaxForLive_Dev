from pathlib import Path
from py2max.grid_space import GridSpace
from py2max.objects import Patch, DialBox, SendBox, PrependBox, MaxLine, CommentBox, FontStyle, TextJustification
from py2max.json_encoder import MaxJSONEncoder
import json

def hex2rgb(hex_color: str) -> list:
    hex_color = hex_color.lstrip('#')
    return [int(hex_color[i:i+2], 16)/255.0 for i in (0, 2, 4)]


def generate_routing_matrix_patch(N) -> Patch:
    WIDTH = 29.0
    patching_gridspace = GridSpace(x0=10.0, y0=10.0, width=90.0, height=90.0)
    presentation_gridspace = GridSpace(x0=0.0, y0=0.0, width=WIDTH, height=24)

    patch = Patch(patching_gridspace)
   
    # Add field controllers and their labels on the left
    X0, Y0 = 0, 1
    XP0, YP0 = 0, 0.9

    # Add send message box
    patch.XY = 0, Y0 + N
    send_box = SendBox(text="---RoutingMatrix")
    patch.add_box(send_box)
    
    COLORS = ["ff544b","66cf5b","008de2","2ae2df","ff8bc6","e8cf2a"]
    COL_LABELS = "R,G,B,C,M,Y".split(",")
    ROW_LABELS = "Rfreq,Gfreq,Bfreq,Cfreq,Mfreq,Yfreq".split(",")

    # TOP LABELS
    for j in range(N): # iterate over columns
        patch.XY = X0 + j, Y0 - 1
        column_label = CommentBox(
            text=COL_LABELS[j], 
            font_size=14.0,
            font_style=FontStyle.BOLD,
            text_justification=TextJustification.CENTER,
            color_hex=COLORS[j])
        patch.add_box(column_label)
        column_label.presentation = True
        column_label.box_dict["box"]["presentation_rect"][0:2] = presentation_gridspace.compute_xy(j, 0)

        column_label.box_dict["box"]["patching_rect"][2] = WIDTH
        column_label.box_dict["box"]["presentation_rect"][2] = WIDTH

    # RIGHT LABELS
    for i in range(N):
        patch.XY = X0 + N, Y0 + i
        row_label = CommentBox(
            text=ROW_LABELS[i], 
            font_size=14.0,
            font_style=FontStyle.BOLD,
            text_justification=TextJustification.CENTER,
            color_hex=COLORS[i])
        patch.add_box(row_label)
        row_label.presentation = True
        row_label.box_dict["box"]["presentation_rect"][0:2] = presentation_gridspace.compute_xy(N, XP0 + i+1)
        row_label.box_dict["box"]["patching_rect"][2] = WIDTH
        row_label.box_dict["box"]["presentation_rect"][2] = WIDTH

    # DIAL MATRIX
    for i in range(N): # iterate over rows
        for j in range(N): # iterate over columns
            patch.XY = X0 + j, Y0 + i
            name = f"route_{j}_{i}"

            # DIAL
            dial = DialBox(name=name, shortname=name)
            patch.add_box(dial)
            dial.presentation = True
            dial.box_dict["box"]["presentation_rect"][0:2] = presentation_gridspace.compute_xy(XP0 + j, YP0 + i)

            dial.box_dict["box"]["activedialcolor"] = hex2rgb(COLORS[j]) + [1.0]
            dial.box_dict["box"]["saved_attribute_attributes"]["activedialcolor"] = {"expression": ""}
            dial.box_dict["box"]["activeneedlecolor"] = hex2rgb(COLORS[i]) + [1.0]
            dial.box_dict["box"]["saved_attribute_attributes"]["activeneedlecolor"] = {"expression": ""}

            # PREPEND
            prepend = PrependBox(message=f"{j} {i}")
            patch.Y += 0.4
            patch.add_box(prepend)

            # Connect dial -> prepend -> send
            patch.add_line(MaxLine(dial, prepend, src_outlet=1, dst_inlet=0))
            patch.add_line(MaxLine(prepend, send_box, src_outlet=0, dst_inlet=0))

    return patch



def main() -> None:
    HERE = Path(__file__).parent.resolve()
   
    patch: Patch = generate_routing_matrix_patch(2)
    patch_dict = patch.dict
    patch_dict["patcher"]["openinpresentation"] = 1

    target_file = HERE / "mg0b.routing_matrix_22.maxpat"
    
    encoded = MaxJSONEncoder().encode(patch_dict)
    with open(target_file, "wb") as f:
        f.write(encoded.encode('utf-8'))

    # print(json.dumps(patch_dict, indent=4))


if __name__ == "__main__":
    main()