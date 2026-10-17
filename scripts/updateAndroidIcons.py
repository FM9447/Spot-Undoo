import os
from PIL import Image

logo_path = "/media/fm9447/D/MULearn/Hackotberfest/public/spot-undoo-logo.png"
if not os.path.exists(logo_path):
    logo_path = "/media/fm9447/D/MULearn/Hackotberfest/public/logo.png"

res_dir = "/media/fm9447/D/MULearn/Hackotberfest/android/app/src/main/res"

src = Image.open(logo_path).convert("RGBA")

# Mipmap densities
densities = {
    "mipmap-mdpi": (48, 48),
    "mipmap-hdpi": (72, 72),
    "mipmap-xhdpi": (96, 96),
    "mipmap-xxhdpi": (144, 144),
    "mipmap-xxxhdpi": (192, 192),
}

# 1. Update App Launcher Icons (ic_launcher.png, ic_launcher_round.png, ic_launcher_foreground.png)
for folder, size in densities.items():
    folder_path = os.path.join(res_dir, folder)
    if not os.path.exists(folder_path):
        continue
    
    # Square & round icon with white padding
    icon = Image.new("RGBA", size, (255, 255, 255, 255))
    src_resized = src.copy()
    src_resized.thumbnail((int(size[0] * 0.82), int(size[1] * 0.82)), Image.Resampling.LANCZOS)
    x = (size[0] - src_resized.width) // 2
    y = (size[1] - src_resized.height) // 2
    icon.paste(src_resized, (x, y), src_resized)
    
    icon.save(os.path.join(folder_path, "ic_launcher.png"), "PNG")
    icon.save(os.path.join(folder_path, "ic_launcher_round.png"), "PNG")
    
    # Foreground icon
    fg_size = (int(size[0] * 1.5), int(size[1] * 1.5))
    fg = Image.new("RGBA", fg_size, (0, 0, 0, 0))
    src_fg = src.copy()
    src_fg.thumbnail((int(fg_size[0] * 0.65), int(fg_size[1] * 0.65)), Image.Resampling.LANCZOS)
    fx = (fg_size[0] - src_fg.width) // 2
    fy = (fg_size[1] - src_fg.height) // 2
    fg.paste(src_fg, (fx, fy), src_fg)
    fg.save(os.path.join(folder_path, "ic_launcher_foreground.png"), "PNG")

print("App launcher icons successfully updated!")

# 2. Update Splash Screens (shown when launched)
splash_dirs = [
    ("drawable", (480, 800)),
    ("drawable-port-mdpi", (320, 480)),
    ("drawable-port-hdpi", (480, 800)),
    ("drawable-port-xhdpi", (720, 1280)),
    ("drawable-port-xxhdpi", (960, 1600)),
    ("drawable-port-xxxhdpi", (1280, 1920)),
    ("drawable-land-mdpi", (480, 320)),
    ("drawable-land-hdpi", (800, 480)),
    ("drawable-land-xhdpi", (1280, 720)),
    ("drawable-land-xxhdpi", (1600, 960)),
    ("drawable-land-xxxhdpi", (1920, 1280)),
]

for folder, canvas_size in splash_dirs:
    folder_path = os.path.join(res_dir, folder)
    if not os.path.exists(folder_path):
        continue
    
    # Light clean splash background (#F4F6F9)
    splash = Image.new("RGBA", canvas_size, (244, 246, 249, 255))
    src_splash = src.copy()
    max_w = int(canvas_size[0] * 0.55)
    max_h = int(canvas_size[1] * 0.28)
    src_splash.thumbnail((max_w, max_h), Image.Resampling.LANCZOS)
    sx = (canvas_size[0] - src_splash.width) // 2
    sy = (canvas_size[1] - src_splash.height) // 2
    splash.paste(src_splash, (sx, sy), src_splash)
    splash.save(os.path.join(folder_path, "splash.png"), "PNG")

print("Splash screens successfully generated!")
