#!/bin/bash

echo "🤖 CBO-Bro Avatar Setup"
echo "======================"
echo ""
echo "Please save your CBO-Bro avatar image (the green business robot) as:"
echo "👉 mini-app/public/cbo-avatar.png"
echo ""
echo "The image should show:"
echo "• Green cube-headed character with glasses"
echo "• Black business suit with orange tie"
echo "• Holding a phone showing charts"
echo "• Standing on stacks of money"
echo ""
echo "Once you've added the image, the Mini App will display it everywhere!"
echo ""

# Check if image exists
if [ -f "mini-app/public/cbo-avatar.png" ]; then
    echo "✅ Avatar image found!"
    # Get file size
    size=$(ls -lh mini-app/public/cbo-avatar.png | awk '{print $5}')
    echo "📊 File size: $size"
else
    echo "❌ Avatar image not found"
    echo ""
    echo "To add it:"
    echo "1. Save the image as: mini-app/public/cbo-avatar.png"
    echo "2. Run: ./deploy.sh"
fi