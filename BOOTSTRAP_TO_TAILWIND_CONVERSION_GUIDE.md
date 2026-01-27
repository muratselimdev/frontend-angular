# Bootstrap to Tailwind CSS Conversion Guide

## Migration Status

✅ **Completed:**
- Removed Bootstrap from package.json
- Removed Bootstrap CSS/JS from angular.json
- Removed Bootstrap button styles from styles.scss
- Removed Bootstrap-specific classes from app.component.scss
- Converted key components:
  - login.component.html
  - treatment-form.component.html
  - treatment-group-form.component.html
  - treatments-list.component.html
  - customer-layout.component.html
  - customer-request-form.component.html
  - admin-layout.component.html (already using Tailwind)

## Common Bootstrap to Tailwind Conversions

### Buttons
```html
<!-- Bootstrap -->
<button class="btn btn-primary">Click me</button>
<button class="btn btn-sm btn-warning">Warning</button>
<button class="btn btn-danger ms-2">Delete</button>

<!-- Tailwind -->
<button class="bg-[#16edb1] hover:bg-[#13c99a] text-white font-semibold px-4 py-2 rounded-md transition-colors duration-200">Click me</button>
<button class="bg-yellow-500 hover:bg-yellow-600 text-white text-sm px-3 py-1 rounded transition-colors duration-200">Warning</button>
<button class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded ml-2 transition-colors duration-200">Delete</button>
```

### Form Controls
```html
<!-- Bootstrap -->
<input class="form-control" type="text" />
<select class="form-select">...</select>
<textarea class="form-control" rows="3"></textarea>

<!-- Tailwind -->
<input class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" type="text" />
<select class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">...</select>
<textarea class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" rows="3"></textarea>
```

### Form Groups
```html
<!-- Bootstrap -->
<div class="mb-3">
  <label class="form-label">Email</label>
  <input class="form-control" type="email" />
</div>

<!-- Tailwind -->
<div class="mb-4">
  <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
  <input class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" type="email" />
</div>
```

### Checkboxes
```html
<!-- Bootstrap -->
<div class="form-check">
  <input type="checkbox" class="form-check-input" id="check1" />
  <label class="form-check-label" for="check1">Check me</label>
</div>

<!-- Tailwind -->
<div class="flex items-center">
  <input type="checkbox" class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" id="check1" />
  <label class="ml-2 text-sm text-gray-700" for="check1">Check me</label>
</div>
```

### Cards
```html
<!-- Bootstrap -->
<div class="card p-4 shadow-sm">
  <h5 class="card-title">Title</h5>
  <p class="card-text">Content</p>
</div>

<!-- Tailwind -->
<div class="bg-white p-6 rounded-lg shadow-md">
  <h5 class="text-xl font-bold mb-2">Title</h5>
  <p class="text-gray-700">Content</p>
</div>
```

### Tables
```html
<!-- Bootstrap -->
<table class="table table-bordered">
  <thead>
    <tr><th>Name</th></tr>
  </thead>
  <tbody>
    <tr><td>John</td></tr>
  </tbody>
</table>

<!-- Tailwind -->
<table class="min-w-full divide-y divide-gray-200 border border-gray-300">
  <thead class="bg-gray-50">
    <tr>
      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">Name</th>
    </tr>
  </thead>
  <tbody class="bg-white divide-y divide-gray-200">
    <tr class="hover:bg-gray-50">
      <td class="px-6 py-4 whitespace-nowrap border-b border-gray-200">John</td>
    </tr>
  </tbody>
</table>
```

### Alerts
```html
<!-- Bootstrap -->
<div class="alert alert-danger">Error message</div>
<div class="alert alert-success">Success message</div>

<!-- Tailwind -->
<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">Error message</div>
<div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">Success message</div>
```

### Spacing Utilities
```
Bootstrap → Tailwind
mb-2 → mb-2 or mb-3
mb-3 → mb-4
mt-3 → mt-4
ms-2 → ml-2
me-2 → mr-2
ps-3 → pl-6
pe-3 → pr-6
```

### Text Colors
```
text-primary → text-blue-600
text-danger → text-red-600
text-success → text-green-600
text-warning → text-yellow-600
text-muted → text-gray-600
text-dark → text-gray-900
```

### Layout
```html
<!-- Bootstrap -->
<div class="container mt-4">
  <div class="row">
    <div class="col-md-6">Left</div>
    <div class="col-md-6">Right</div>
  </div>
</div>

<!-- Tailwind -->
<div class="max-w-7xl mx-auto px-4 mt-6">
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>Left</div>
    <div>Right</div>
  </div>
</div>
```

### Spinners/Loading
```html
<!-- Bootstrap -->
<span class="spinner-border spinner-border-sm me-2"></span>

<!-- Tailwind -->
<svg class="animate-spin inline-block w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
</svg>
```

## Files Still Needing Conversion

### Admin Components (Priority: Medium)
- treatment-groups-list.component.html
- translators-list.component.html
- translator-leads-list.component.html
- supervisors-list.component.html
- And other admin list/form components

### Customer Components (Priority: High)
- customer-register.component.html
- customer-dashboard.component.html
- customer-login.component.html
- customer-requests.component.html

### Staff Components (Priority: Medium)
- calls-list.component.html
- call-detail.component.html
- agent-layout.component.html

## Primary Color
Use the custom primary color in buttons and accents:
- Background: `bg-[#16edb1]`
- Hover: `hover:bg-[#13c99a]`

## Notes
- Tailwind is already configured in the project (tailwind.config.js, postcss.config.js)
- Custom CSS variables are defined in :root for primary colors
- All Angular Material theming remains intact
- ngx-toastr styles are still included
