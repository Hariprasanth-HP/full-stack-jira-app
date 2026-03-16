# 🧱 Components And Styling

## Components Best Practices

#### Colocate things as close as possible to where it's being used

Keep components, functions, styles, state, etc. as close as possible to where they are being used. This will not only make your codebase more readable and easier to understand but it will also improve your application performance since it will reduce redundant re-renders on state updates.

#### Avoid large components with nested rendering functions

Do not add multiple rendering functions inside your application, this gets out of control pretty quickly. What you should do instead is if there is a piece of UI that can be considered as a unit, is to extract it in a separate component.

```javascript
// this is very difficult to maintain as soon as the component starts growing
function Component() {
  function renderItems() {
    return <ul>...</ul>;
  }
  return <div>{renderItems()}</div>;
}

// extract it in a separate component
function Items() {
  return <ul>...</ul>;
}

function Component() {
  return (
    <div>
      <Items />
    </div>
  );
}
```

#### Stay consistent

Keep your code style consistent. For example, if you name your components using pascal case, do it everywhere. Most of code consistency is achieved by using linters and code formatters, so make sure you have them set up in your project.

#### Limit the number of props a component is accepting as input

If your component is accepting too many props you might consider splitting it into multiple components or use the composition technique via children or slots.

[Composition Example Code](../apps/react-vite/src/components/ui/dialog/confirmation-dialog/confirmation-dialog.tsx)

#### Abstract shared components into a component library

For larger projects, it is a good idea to build abstractions around all the shared components. It makes the application more consistent and easier to maintain. Identify repetitions before creating the components to avoid wrong abstractions.

[Component Library Example Code](../apps/react-vite/src/components/ui/button/button.tsx)

It is a good idea to wrap 3rd party components as well in order to adapt them to the application's needs. It might be easier to make the underlying changes in the future without affecting the application's functionality.

[3rd Party Component Example Code](../apps/react-vite/src/components/ui/link/link.tsx)

## Component libraries

Every project requires some UI components such as modals, tabs, sidebars, menus, etc. Instead of building those from scratch, you might want to use some of the existing, battle-tested component libraries.

#### Headless component libraries:

These component libraries come with their components unstyled. If you have a specific design system to implement, it might be easier and better solution to go with headless components that come unstyled than to adapt a fully featured component library such as Material UI to your needs. Some good options are:

- [Radix UI](https://www.radix-ui.com/)

## Styling Solutions

There are multiple ways to style a react application. Some good options are:

- [tailwind](https://tailwindcss.com/)

NOTE: Keep React Server Components in mind as they require zero runtime styling solution.

With the rise of headless component libraries, there is another tier of component libraries where predefined components are provided with styling solutions included, but instead of being installed as a package, they are provided as code which can be customized and styled as needed.

- [ShadCN UI](https://ui.shadcn.com/)
