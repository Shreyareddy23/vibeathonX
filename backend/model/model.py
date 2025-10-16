import torch
import torch.nn as nn

class EmotionTransformer(nn.Module):
    def __init__(self, input_dim=1404, num_classes=5, d_model=128, nhead=4, num_layers=2, dim_feedforward=256):
        super(EmotionTransformer, self).__init__()

        self.embedding = nn.Linear(input_dim, d_model)
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model,
            nhead=nhead,
            dim_feedforward=dim_feedforward,
            batch_first=True
        )
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)
        self.fc = nn.Linear(d_model, num_classes)

    def forward(self, x):
        # Ensure input is 2D [batch_size, sequence_length]
        if len(x.shape) == 1:
            x = x.unsqueeze(0)
        
        # Project input to d_model dimensions
        x = self.embedding(x)
        
        # Add sequence dimension for transformer
        x = x.unsqueeze(1)
        
        # Pass through transformer
        x = self.transformer(x)
        
        # Remove sequence dimension and get final prediction
        x = x.squeeze(1)
        return self.fc(x)
   