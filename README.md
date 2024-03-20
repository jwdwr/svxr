# svxr

proof of concept for a progressive XR webapp with Svelte and A-Frame.

# how to

The `Scene` wraps the page, and can be toggled between 2D and 3D. Within a scene, the `Component3d` wraps an individual 2D component and allows it to be positioned freely in 3D space when 3D is enabled. This is accomplished with the `Portal3d`, which can be used to position arbitrary objects in 3D space while remaining connected to the Svelte state. `Button3D` is an example of a progressive 2D/3D component, which appears as a normal button in 2D, but takes on extra depth and interactivity in 3D.

# the demo

https://svxr.vercel.app/

A simple app that takes a text input, shows a loading modal, and then renders a 3D model generated by `perflow-trispor`.

# next steps

- Development will not continue in this repository. The concept is proved.
- Components should be extracted into a library. Web components would be ideal.
- XR layer should be added to the Component3D so that HTML can be rendered at higher resolutions.
- All input elements need progressive XR equivalents, as they are not rendered in SVG foreign objects.
