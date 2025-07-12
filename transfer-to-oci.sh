#!/bin/bash

# Transfer Files to OCI Script
# Run this from your local machine

set -e

# Configuration
OCI_IP="151.145.43.229"
OCI_USER="opc"
PRIVATE_KEY_PATH="key/ssh-key-2025-07-12.key"  # Your OCI private key
ARCHIVE_NAME="spade-app.tar.gz"

echo "📦 Preparing files for transfer..."

# Create archive excluding unnecessary files
tar -czf $ARCHIVE_NAME \
    --exclude=node_modules \
    --exclude=.next \
    --exclude=.git \
    --exclude=*.log \
    --exclude=data \
    --exclude=Deploy \
    --exclude=cpanel-build \
    --exclude=test_server_ \
    .

echo "📁 Archive created: $ARCHIVE_NAME"
echo "📊 Archive size: $(du -h $ARCHIVE_NAME | cut -f1)"

# Transfer to OCI
echo "🚀 Transferring to OCI..."
if [ -f "$PRIVATE_KEY_PATH" ]; then
    scp -i "$PRIVATE_KEY_PATH" "$ARCHIVE_NAME" "$OCI_USER@$OCI_IP:~/"
    echo "✅ Files transferred successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. SSH to your OCI instance:"
    echo "   ssh -i $PRIVATE_KEY_PATH $OCI_USER@$OCI_IP"
    echo ""
    echo "2. Extract files:"
    echo "   tar -xzf $ARCHIVE_NAME"
    echo "   cd lite_spade"
    echo ""
    echo "3. Deploy:"
    echo "   ./deploy-oci.sh"
    echo ""
else
    echo "❌ Private key not found at: $PRIVATE_KEY_PATH"
    echo "Please update the PRIVATE_KEY_PATH variable in this script"
    echo "Or use scp manually:"
    echo "scp -i your-private-key.pem $ARCHIVE_NAME $OCI_USER@$OCI_IP:~/"
fi

# Clean up local archive
echo "🧹 Cleaning up local archive..."
rm -f "$ARCHIVE_NAME"
echo "✅ Local cleanup complete!" 