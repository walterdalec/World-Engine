# 🎨 Portrait Integration Instructions

## System Overview
The portrait system now supports **real artwork** with gender-locked classes. When you provide images, they will automatically be used instead of the procedural placeholders.

## How to Add Your Realistic Portraits

### 1. Prepare Your Images
- **Format**: JPG, PNG, or SVG
- **Size**: 200x250 pixels (portrait orientation) 
- **Style**: Grimdark fantasy art like your reference image
- **Quality**: High resolution for crisp display

### 2. Save Images to Directory
Place your images in: `public/assets/portraits-realistic/`

**Naming Convention:**
- `{species}-{archetype}-{gender}.jpg`
- Examples:
  - `human-ashblade-male.jpg`
  - `human-greenwarden-female.jpg`
  - `draketh-cinder-mystic-female.png`

### 3. Update Configuration
Edit `src/portraitConfig.ts` and add entries like:

```typescript
'human': {
    'Ashblade': {
        genderLocked: 'male',
        imagePath: '/assets/portraits-realistic/human-ashblade-male.jpg',
        description: 'Weathered warrior with ash-forged blade'
    },
    'Greenwarden': {
        genderLocked: 'female', 
        imagePath: '/assets/portraits-realistic/human-greenwarden-female.jpg',
        description: 'Nature priestess with living staff'
    }
}
```

### 4. Gender Locking Options
- `genderLocked: 'male'` - Only male characters can select this class
- `genderLocked: 'female'` - Only female characters can select this class  
- No `genderLocked` property - Available to both genders

## Current Gender-Locked Classes

### Male-Only Classes:
- **Ashblade** - Brutal warriors with ash-forged weapons
- **Thorn Knight** - Armored defenders with thorned weapons
- **Stormcaller** - Lightning wielders with storm powers
- **Sky Knight** - Aerial cavalry commanders

### Female-Only Classes:
- **Greenwarden** - Nature priestesses with living staffs
- **Bloomcaller** - Diplomatic flower mages
- **Cinder Mystic** - Fire sorceresses of the ash wastes
- **Voidwing** - Shadowy warriors with dark wings

### Gender-Neutral Classes:
- **Sapling Adept** - Young nature magic students

## Testing Your Images

1. **Build the project**: `npm run build`
2. **Start dev server**: `npm start`
3. **Navigate to character creation**
4. **Select a species and gender**
5. **Choose a gender-locked class** 
6. **Check the portrait preview**

## System Benefits

✅ **Automatic Fallbacks**: If image fails to load, shows placeholder  
✅ **Smart Gender Filtering**: Invalid classes are hidden from selection  
✅ **Visual Feedback**: Warnings shown for invalid combinations  
✅ **Performance**: Images cached after first load  
✅ **Flexible**: Easy to add new species/class combinations

## Troubleshooting

**Image not showing?**
- Check file path matches configuration exactly
- Verify image is in `public/assets/portraits-realistic/`
- Check browser console for loading errors
- Ensure image file format is supported (JPG/PNG/SVG)

**Class not appearing?**
- Verify gender lock matches selected character gender
- Check `portraitConfig.ts` spelling matches `defaultWorlds.ts`
- Ensure species name matches exactly (case-sensitive)

**Want to change gender locks?**
- Edit `portraitConfig.ts` 
- Change `genderLocked` property or remove it entirely
- Restart development server

## Next Steps

Send me your grimdark artwork files and I'll help integrate them into the system! The more realistic portraits you provide, the better the character creation experience will become.