from pathlib import Path
from py2max.grid_space import GridSpace
from py2max.objects import Patch, DialBox, MessageBox
from py2max.json_encoder import MaxJSONEncoder
import json


def generate_routing_matrix_patch(N=2) -> Patch:
    patching_gridspace = GridSpace(x0=29.0, y0=40.0, width=90.0, height=90.0)
    presentation_gridspace = GridSpace(x0=0.0, y0=0.0, width=27.0, height=27.0)

    patch = Patch(patching_gridspace)
    
    # Add field controllers and their labels on the left
    X0, Y0 = 0, 0

    dials_matrix = []
    prepends_matrix = []
    
    for i in range(N):
        dials_column = []
        for j in range(N):
            patch.XY = X0 + j, Y0 + i
            range_size = 128
            name = f"route-{j}-{i}"

            dial = DialBox(name=name, shortname=name, n=range_size)
            
            patch.add_box(dial)
            # patch.add_line(MaxLine(dial, subpatch, 0, N - k))

            dial.presentation = True

            dials_column.append(dial)
        
        dials_matrix.append(dials_column)

    
    # Add send message box
    patch.XY = 0, 1
    send_box = MessageBox(message=";\n---RoutingMatrix $1")
    send_box.presentation = True
    patch.add_box(send_box, W=128)

    return patch



def main() -> None:
    HERE = Path(__file__).parent.resolve()
   
    patch: Patch = generate_routing_matrix_patch()

    target_file = HERE / "mg0b.test.maxpat"
    
    encoded = MaxJSONEncoder().encode(patch.dict)
    with open(target_file, "wb") as f:
        f.write(encoded.encode('utf-8'))

    print(json.dumps(patch.dict, indent=4))


if __name__ == "__main__":
    main()