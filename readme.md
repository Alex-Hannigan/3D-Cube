# 3D Cube

### Controls
| Key | Function |
| ----------- | ----------- |
| Spacebar | Play/Pause rotation |
| Arrow Keys | Set rotation direction |
| T | Render next triangle |
| Z | Cycle render mode |

### Render Modes
1. Shaded
2. Wireframe (with hidden surface removal)
3. Wireframe (without hidden surface removal)

### Reference
The code for this project was based partially on the following videos.  
[Code-It-Yourself! 3D Graphics Engine Part #1 - Triangles & Projection](https://youtu.be/ih20l3pJoeU)  
[Code-It-Yourself! 3D Graphics Engine Part #2 - Normals, Culling, Lighting & Object Files](https://youtu.be/XgMWc6LumG4)

The code in the videos above was written in C++, and made use of convenience functions from an outside library written by the creator of the videos, whereas I chose to implement everything in plain JavaScript.  
Additionally in my code I did not use matrices, as I wanted to focus on implementing and understanding the fundamentals of 3D graphics in the most straightforward way, without stuff like matrix calculations becoming a distraction.  
I also chose to add controls for cycling through the different render modes, and for rendering each triangle one at a time, to help visualize what's going on in the rendering process.